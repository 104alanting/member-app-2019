import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withRouter } from "react-router-dom";
import { withStyles } from "@material-ui/core/styles";

import Typography from "@material-ui/core/Typography";
import FAB from "@material-ui/core/Fab";
import Create from "@material-ui/icons/Create";

import * as apiContentActions from "../store/actions/apiContentActions";
import ContentTile from "../components/ContentTile";

const styles = theme => ({
  root: {
    margin: "0 auto",
    width: "100%",
    maxWidth: 1920,
    paddingBottom: 60
  },
  section: {
    padding: "60px 0 0 0"
  },
  head: {
    color: theme.palette.primary.main
  },
  buttonEdit: {
    position: "absolute",
    bottom: 20,
    right: 20,
    visibility: "hidden"
  },
  actionArea: {
    borderRadius: 6,
    zIndex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "rgba(0,0,0,.05)"
    },
    "&:hover $buttonEdit": {
      visibility: "visible"
    }
  },
  gridWrapper: {
    margin: "0 auto",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: "50px 0",
    [theme.breakpoints.down("sm")]: {
      padding: "10px 0px"
    }
  },
  card: {
    width: "31%",
    padding: 20,
    margin: "10px",
    position: "relative",
    border: `1px solid ${theme.palette.primary.main}`,
    [theme.breakpoints.down("md")]: {
      width: "47%"
    },
    [theme.breakpoints.down("sm")]: {
      width: "100%",
      margin: "10px 0px"
    }
  }
});

class ContentLibrary extends React.Component {
  componentDidMount() {
    const { authToken } = this.props.appState;
    // console.log(authToken);
    this.props.apiContent.getAllContent(authToken).then(result => {
      // console.log(result);
    });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.appState.authToken && this.props.appState.authToken) {
      this.props.apiContent
        .getAllContent(this.props.appState.authToken)
        .then(result => {
          // console.log(result);
        });
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.section}>
        <Typography
          variant="h2"
          align="center"
          gutterBottom
          className={classes.head}
          style={{ paddingTop: 20 }}
        >
          Content Library
        </Typography>
        <div className={classes.gridWrapper}>
          {this.props.content.allContent.map(tile => {
            return (
              <div className={classes.card} key={tile.id}>
                <div
                  className={classes.actionArea}
                  tabIndex={0}
                  onClick={() => this.props.history.push(`/edit/${tile.id}`)}
                >
                  <FAB
                    className={classes.buttonEdit}
                    onClick={() => this.props.history.push(`/edit/${tile.id}`)}
                    color="primary"
                    aria-label="Edit Content"
                  >
                    <Create />
                  </FAB>
                </div>
                <ContentTile contentTile={tile} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

ContentLibrary.propTypes = {
  classes: PropTypes.object.isRequired,
  appState: PropTypes.shape({
    loggedIn: PropTypes.bool
  }),
  handleDeleteDialogOpen: PropTypes.func,
  content: PropTypes.shape({
    filteredList: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        contentType: PropTypes.string,
        content: PropTypes.string,
        updated_at: PropTypes.string
      })
    ),
    allContent: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        contentType: PropTypes.string,
        content: PropTypes.string,
        updated_at: PropTypes.string
      })
    ),
    currentContent: PropTypes.shape({
      id: PropTypes.string,
      contentType: PropTypes.string,
      content: PropTypes.string,
      updated_at: PropTypes.string
    }),
    apiContent: PropTypes.shape({
      getAllContent: PropTypes.func
    })
  })
};

const mapStateToProps = state => ({
  appState: state.appState,
  profile: state.profile,
  content: state.content
});

const mapDispatchToProps = dispatch => ({
  apiContent: bindActionCreators(apiContentActions, dispatch)
});

export default withStyles(styles)(
  withRouter(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(ContentLibrary)
  )
);
