import React from 'react';
import PropTypes from 'prop-types';
import ReactRouterPropTypes from 'react-router-prop-types';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { api } from 'utils';

export class ViewEvent extends React.Component {
    static propTypes = {
        match: ReactRouterPropTypes.match.isRequired,
    }

    state = {
        event: null,
    }

    componentDidMount () {
        const { id } = this.props.match.params;
        api.get(`/events/${id}`)
            .then(({ data }) => this.setState({ event: data.data }));
    }

    render () {
        const { event } = this.state;

        return (
            <div className="m-8 mx-auto max-w-2xl sm:w-4/4 lg:w-3/4 p-2">
                <Card>
                    <CardMedia
                        image="/static/images/cards/contemplative-reptile.jpg"
                        title="Contemplative Reptile"
                    />
                    <CardContent>
                        <Typography gutterBottom variant="headline" component="h2">
                 Lizard
                        </Typography>
                        <Typography component="p">
                 Lizards are a widespread group of squamate reptiles, with over 6,000 species, ranging
                 across all continents except Antarctica
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Button size="small" color="primary">
                 Share
                        </Button>
                        <Button size="small" color="primary">
                 Learn More
                        </Button>
                    </CardActions>
                </Card>
            </div>
        );
    }
}
