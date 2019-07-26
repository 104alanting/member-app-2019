import React from "react";
import PropTypes from "prop-types";
import queryString from "query-string";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import CardMedia from "@material-ui/core/CardMedia";
import Card from "@material-ui/core/Card";

import * as apiContentActions from "../store/actions/apiContentActions";
import { defaultWelcomeInfo } from "../utils/index";
import SamplePhoto from "../img/sample-form-photo.jpg";

const styles = theme => ({
  root: {
    margin: "40px 0",
    color: theme.palette.primary.main
  },
  body: {
    color: "black"
  },
  media: {
    height: "auto",
    paddingTop: "56.25%", // 16:9,
    position: "relative"
  },
  card: {
    maxWidth: 600,
    margin: "0 auto",
    padding: 20
  }
});

export class WelcomeInfoUnconnected extends React.Component {
  classes = this.props.classes;
  constructor(props) {
    super(props);
    this.state = {
      headline: defaultWelcomeInfo.headline,
      body: defaultWelcomeInfo.body,
      image: null
    };
  }

  componentDidMount() {
    const values = queryString.parse(this.props.location.search);
    // if find contact id, call API to fetch contact info for prefill
    if (values.h || values.b || values.i) {
      const { h, i, b } = values;
      const queryIds = [h, i, b];
      queryIds.forEach(id => {
        this.props.apiContent
          .getContentById(id)
          .then(result => {
            if (!result || result.payload.message) {
              console.log(
                result.payload.message ||
                  "there was an error loading the content"
              );
            } else {
              switch (result.payload.content_type) {
                case "headline":
                  return this.setState({ headline: result.payload.content });
                case "bodyCopy":
                  return this.setState({ body: result.payload.content });
                case "image":
                  return this.setState({ image: result.payload.content });
                default:
                  break;
              }
            }
          })
          .catch(err => {
            console.log(err);
          });
      });
    }
  }

  render() {
    const { classes } = this.props;
    if (this.props.loading) {
      return <div>loading...</div>;
    }
    return (
      <div className={classes.root} data-test="component-welcome-info">
        <Card className={classes.card}>
          <CardMedia
            className={classes.media}
            title="Welcome Photo"
            alt="Welcome Photo"
            image={this.state.image || SamplePhoto}
          />

          <Typography
            variant="h3"
            align="center"
            gutterBottom
            className={classes.head}
            style={{ paddingTop: 20 }}
            data-test="headline"
          >
            {this.state.headline}
          </Typography>

          <Typography
            variant="body1"
            align="center"
            gutterBottom
            className={classes.body}
            data-test="body"
          >
            {this.state.body}
          </Typography>
        </Card>
      </div>
    );
  }
}

WelcomeInfoUnconnected.propTypes = {
  classes: PropTypes.object
};

const mapStateToProps = state => ({
  loading: state.appState.loading
});

const mapDispatchToProps = dispatch => ({
  apiContent: bindActionCreators(apiContentActions, dispatch)
});

export default withStyles(styles)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(WelcomeInfoUnconnected)
);
