/**
 * Created by maciejmarzeta on 17.05.2018.
 */
const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
const follow = require('./follow');

const root = '/api';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            places: [],
            attributes: [],
            pageSize: 2,
            links: {}
        };

        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
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
                this.schema = schema.entity;
                return placesCollection;
            });
        }).done(placesCollection => {
            this.setState({
                places: placesCollection.entity._embedded.places,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: placesCollection.entity._links
            });
        });
    }

    onDelete(place) {
        client({method: 'DELETE', path: place._links.self.href}).done(response => {
            this.loadFromServer(this.state.pageSize);
        });
    }

    onCreate(newPlace) {
        follow(client, root, ['places']).then(placesCollection => {
            return client({
                method: 'POST',
                path: placesCollection.entity._links.self.href,
                entity: newPlace,
                headers: {'Content-Type': 'application/json'}
            })
        }).then(response => {
            return follow(client, root, [
                {rel: 'places', params: {'size': this.state.pageSize}}]);
        }).done(response => {
            if (typeof response.entity._links.last != "undefined") {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        });
    }

    onNavigate(navUri) {
        client({method: 'GET', path: navUri}).done(placeCollection => {
            this.setState({
                places: placeCollection.entity._embedded.places,
                attributes: this.state.attributes,
                pageSize: this.state.pageSize,
                links: placeCollection.entity._links
            });
        });
    }

    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes}
                              onCreate={this.onCreate}/>
                <ProfileList profiles={this.state.places}
                             links={this.state.links}
                             pageSize={this.state.pageSize}
                             onNavigate={this.onNavigate}
                             onDelete={this.onDelete}
                             updatePageSize={this.updatePageSize}
                />
            </div>
        )
    }
}

class ProfileList extends React.Component {
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
        var profiles = this.props.profiles.map(profile =>
            <Profile key={profile._links.self.href} profile={profile} onDelete={this.props.onDelete}/>
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
                    </tr>
                    {profiles}
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

class Profile extends React.Component {
    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.profile);
    }

    render() {
        return (
            <tr>
                <td>{this.props.profile.x_cord}</td>
                <td>{this.props.profile.y_cord}</td>
                <td>{this.props.profile.description}</td>
                <td>{this.props.profile.date_from}</td>
                <td>{this.props.profile.date_to}</td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
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

ReactDOM.render(
    <App />,
    document.getElementById('react')
)