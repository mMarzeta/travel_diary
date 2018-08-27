/**
 * Created by maciejmarzeta on 17.05.2018.
 */
const React = require('react');
const ReactDOM = require('react-dom');
const when = require('when');
const client = require('./client');
const follow = require('./follow');

const stompClient = require('./websocket-listener');

const root = '/api';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            places: [],
            attributes: [],
            page: 1,
            pageSize: 6,
            links: {},
            loggedInManager: this.props.loggedInManager,
        };

        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
        this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
    }

    loadFromServer(pageSize) {
        follow(client, root, [
            {rel: 'places', params: {size: pageSize}}]
        ).then(placesCollection => {
            return client({
                method: 'GET',
                path: placesCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            }).then(schema => {
                Object.keys(schema.entity.properties).forEach(function (property) {
                    if (schema.entity.properties[property].hasOwnProperty('format') &&
                        schema.entity.properties[property].format === 'uri') {
                        delete schema.entity.properties[property];
                    }
                    else if (schema.entity.properties[property].hasOwnProperty('$ref')) {
                        delete schema.entity.properties[property];
                    }
                });

                this.schema = schema.entity;
                this.links = placesCollection.entity._links;
                return placesCollection;
            });
        }).then(placesCollection => {
            this.page = placesCollection.entity.page;
            return placesCollection.entity._embedded.places.map(place =>
                client({
                    method: 'GET',
                    path: place._links.self.href
                })
            );
        }).then(placePromises => {
            return when.all(placePromises);
        }).done(places => {
            this.setState({
                page: this.page,
                places: places,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: this.links
            });
        });
    }

    onDelete(place) {
        client({method: 'DELETE', path: place.entity._links.self.href}
        ).done(response => {/* let the websocket handle updating the UI */
            },
            response => {
                if (response.status.code === 403) {
                    alert('ACCESS DENIED: You are not authorized to delete ' +
                        place.entity._links.self.href);
                }
            });
    }

    onCreate(newPlace) {
        follow(client, root, ['places']).done(response => {
            client({
                method: 'POST',
                path: response.entity._links.self.href,
                entity: newPlace,
                headers: {'Content-Type': 'application/json'}
            })
        })
    }

    onNavigate(navUri) {
        client({method: 'GET', path: navUri})
            .then(placeCollection => {
                this.links = placeCollection.entity._links;
                this.page = placeCollection.entity.page;

                return placeCollection.entity._embedded.places.map(place => client({
                    method: 'GET',
                    path: place._links.self.href
                }));
            }).then(placePromises => {
            return when.all(placePromises)
        })
            .done(places => {
                this.setState({
                    page: this.page,
                    places: places,
                    attributes: Object.keys(this.schema.properties),
                    pageSize: this.state.pageSize,
                    links: this.links
                });
            });
    }

    onUpdate(place, updatedPlace) {
        if (place.entity.manager.name == this.state.loggedInManager) {
            updatedPlace["manager"] = place.entity.manager;
            client({
                method: 'PUT',
                path: place.entity._links.self.href,
                entity: updatedPlace,
                headers: {
                    'Content-Type': 'application/json',
                    'If-Match': place.headers.Etag
                }
            }).done(response => {
            }, response => {
                if (response.status.code === 403) {
                    alert('ACCESS DENIED: You are not authorized to update ' +
                        place.entity._links.self.href);
                }
                if (response.status.code === 412) {
                    alert('DENIED: Unable to update ' + place.entity._links.self.href +
                        '. Your copy is stale.');
                }
            });
        } else {
            alert("You are not authorized to update.")
        }
    }

    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    refreshAndGoToLastPage(message) {
        follow(client, root, [{
            rel: 'places',
            params: {size: this.state.pageSize}
        }]).done(response => {
            if (response.entity._links.last !== undefined) {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        })
    }

    refreshCurrentPage(message) {
        follow(client, root, [{
            rel: 'places',
            params: {
                size: this.state.pageSize,
                page: this.state.page.number
            }
        }]).then(placesCollection => {
            this.links = placesCollection.entity._links;
            this.page = placesCollection.entity.page;

            return placesCollection.entity._embedded.places.map(place => {
                return client({
                    method: 'GET',
                    path: place._links.self.href
                })
            });
        }).then(placesPromises => {
            return when.all(placesPromises);
        }).then(places => {
            this.setState({
                page: this.page,
                places: places,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
        stompClient.register([
            {route: '/topic/newPlace', callback: this.refreshAndGoToLastPage},
            {route: '/topic/updatePlace', callback: this.refreshCurrentPage},
            {route: '/topic/deletePlace', callback: this.refreshCurrentPage}
        ]);
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes}
                              onCreate={this.onCreate}/>
                <PlacesList page={this.state.page}
                            places={this.state.places}
                            attributes={this.state.attributes}
                            links={this.state.links}
                            pageSize={this.state.pageSize}
                            onNavigate={this.onNavigate}
                            onDelete={this.onDelete}
                            updatePageSize={this.updatePageSize}
                            onUpdate={this.onUpdate}
                            loggedInManager={this.state.loggedInManager}

                />
            </div>
        )
    }
}

class CreateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        var newPlace = {};
        this.props.attributes.forEach(attribute => {
            newPlace[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onCreate(newPlace);

        // clear out the dialog's inputs
        this.props.attributes.forEach(attribute => {
            ReactDOM.findDOMNode(this.refs[attribute]).value = '';
        });

        // Navigate away from the dialog to hide it.
        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map(attribute =>
            <p key={attribute}>
                <input type="text" placeholder={attribute} ref={attribute} className="field"/>
            </p>
        );

        return (
            <div>
                <a href="#createPlace">Create</a>

                <div id="createPlace" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Create new place</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

class UpdateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        var updatedPlace = {};
        this.props.attributes.forEach(attribute => {
            updatedPlace[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onUpdate(this.props.place, updatedPlace);
        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map(attribute =>
            <p key={this.props.place.entity[attribute]}>
                <input type="text" placeholder={attribute}
                       defaultValue={this.props.place.entity[attribute]}
                       ref={attribute} className="field"/>
            </p>
        );

        var dialogId = "updatePlace-" + this.props.place.entity._links.self.href;

        let isManagerCorrect = this.props.place.entity.manager.name == this.props.loggedInManager;

        if (isManagerCorrect == false) {
            return (
                <div>
                    <a>Not your place</a>
                </div>
            )
        } else {
            return (
                <div>
                    <a href={"#" + dialogId}>Update</a>
                    <div id={dialogId} className="modalDialog">
                        <div>
                            <a href="#" title="Close" className="close">X</a>

                            <h2>Update place</h2>

                            <form>
                                {inputs}
                                <button onClick={this.handleSubmit}>Update</button>
                            </form>
                        </div>
                    </div>
                </div>
            )
        }
    }

}
;

class PlacesList extends React.Component {
    constructor(props) {
        super(props);
        this.handleNavFirst = this.handleNavFirst.bind(this);
        this.handleNavPrev = this.handleNavPrev.bind(this);
        this.handleNavNext = this.handleNavNext.bind(this);
        this.handleNavLast = this.handleNavLast.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleNavFirst(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }

    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }

    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }

    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }

    handleInput(e) {
        e.preventDefault();
        var pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value =
                pageSize.substring(0, pageSize.length - 1);
        }
    }

    render() {
        var places = this.props.places.map(place =>
            <Place key={place.entity._links.self.href}
                   place={place}
                   attributes={this.props.attributes}
                   onDelete={this.props.onDelete}
                   onUpdate={this.props.onUpdate}
                   loggedInManager={this.props.loggedInManager}
            />
        );
        var navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

        return (
            <div>
                <table>
                    <tbody>
                    <tr>
                        <th>X cord</th>
                        <th>Y cord</th>
                        <th>Description</th>
                        <th>Date from:</th>
                        <th>Date to:</th>
                        <th>Owner</th>
                    </tr>
                    {places}
                    </tbody>
                </table>
                <div>
                    {navLinks}
                </div>
                Select records per page:
                <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
            </div>
        )
    }
}

class Place extends React.Component {
    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.place);
    }

    render() {
        return (
            <tr>
                <td>{this.props.place.entity.x_cord}</td>
                <td>{this.props.place.entity.y_cord}</td>
                <td>{this.props.place.entity.description}</td>
                <td>{this.props.place.entity.date_from}</td>
                <td>{this.props.place.entity.date_to}</td>
                <td>{this.props.place.entity.manager.name}</td>
                <td>
                    <UpdateDialog place={this.props.place}
                                  attributes={this.props.attributes}
                                  onUpdate={this.props.onUpdate}
                                  loggedInManager={this.props.loggedInManager}
                    />
                </td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
        )
    }
}

ReactDOM.render(
    <App loggedInManager={document.getElementById('managername').innerHTML}/>,
    document.getElementById('react')
)