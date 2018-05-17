/**
 * Created by maciejmarzeta on 17.05.2018.
 */
const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {places: []};
    }

    componentDidMount() {
        client({method: 'GET', path: 'api/places'}).done(response => {
            console.log(response.data);
            this.setState({places: response.entity._embedded.places});
        });
        console.log(this.state.places)
    }

    render() {
        return (
            <ProfileList profiles={this.state.places}/>
        )
    }
}

class ProfileList extends React.Component{
    render() {
        var profiles = this.props.profiles.map(profile =>
            <Profile key={profile._links.self.href} profile={profile}/>
        );
        return (
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
        )
    }
}

class Profile extends React.Component{
    render() {
        return (
            <tr>
                <td>{this.props.profile.x_cord}</td>
                <td>{this.props.profile.y_cord}</td>
                <td>{this.props.profile.description}</td>
                <td>{this.props.profile.date_from}</td>
                <td>{this.props.profile.date_to}</td>
            </tr>
        )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('react')
)