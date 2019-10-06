import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withRouter } from "react-router-dom";
import { withStyles } from "@material-ui/core/styles";
import BASE_URL from "../store/actions/apiConfig";

import Typography from "@material-ui/core/Typography";
import FAB from "@material-ui/core/Fab";
import Create from "@material-ui/icons/Create";
import Delete from "@material-ui/icons/Delete";

import * as apiContentActions from "../store/actions/apiContentActions";
import * as utils from "../utils";
import ContentTile from "../components/ContentTile";
import AlertDialog from "../components/AlertDialog";
import { openSnackbar } from "./Notifier";

const styles = theme => ({
  root: {
    margin: "0 auto",
    width: "100%",
    maxWidth: 1920,
    paddingBottom: 60,
    background: "white",
    minHeight: "100vh"
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
    visibility: "hidden",
    "&:hover": {
      backgroundColor: theme.palette.primary.light
    }
  },
  buttonDelete: {
    position: "absolute",
    bottom: 20,
    right: 80,
    visibility: "hidden",
    backgroundColor: theme.palette.danger.main,
    "&:hover": {
      backgroundColor: theme.palette.danger.light
    }
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
    },
    "&:hover $buttonDelete": {
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

const loginLinkStr = "click here to login";
const loginLink = loginLinkStr.link(`${BASE_URL}/api/auth/google`);
const warning = `You do not have access to the page you were trying to reach. Please ${loginLink} or contact an administrator to request access.`;

export class ContentLibraryUnconnected extends React.Component {
  componentDidMount() {
    const { authToken, userType } = this.props.appState;
    if (authToken && userType) {
      this.props.apiContent
        .getAllContent(authToken, userType)
        .then(result => {
          if (
            result.type === "GET_ALL_CONTENT_FAILURE" ||
            this.props.content.error
          ) {
            openSnackbar(
              "error",
              this.props.content.error ||
                "An error occurred while fetching content"
            );
          }
        })
        .catch(err => {
          openSnackbar("error", err);
        });
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      ((!prevProps.appState.authToken || !prevProps.appState.userType) &&
        (this.props.appState.authToken && this.props.appState.userType)) ||
      prevProps.content.allContent.length !==
        this.props.content.allContent.length ||
      prevProps.appState.userType !== this.props.appState.userType
    ) {
      this.props.apiContent
        .getAllContent(
          this.props.appState.authToken,
          this.props.appState.userType
        )
        .then(result => {
          if (
            result.type === "GET_ALL_CONTENT_FAILURE" ||
            this.props.content.error
          ) {
            openSnackbar(
              "error",
              this.props.content.error ||
                "An error occurred while fetching content"
            );
          }
        })
        .catch(err => {
          openSnackbar("error", err);
        });
    }
  }

  handleDeleteDialogOpen = tile => {
    if (tile && this.props.appState.loggedIn) {
      const { userType } = this.props.appState;
      if (!["admin", "edit"].includes(userType)) {
        openSnackbar("error", warning);
      }
      this.props.apiContent.handleDeleteOpen(tile);
    }
  };

  async deleteContent(contentData) {
    const token = this.props.appState.authToken;
    const { userType } = this.props.appState;
    const contentDeleteResult = await this.props.apiContent.deleteContent(
      token,
      contentData.id,
      userType
    );
    if (
      !contentDeleteResult.type ||
      contentDeleteResult.type !== "DELETE_CONTENT_SUCCESS"
    ) {
      openSnackbar("error", this.props.content.error);
    } else if (
      contentDeleteResult.type === "DELETE_CONTENT_SUCCESS" &&
      contentData.content_type === "image"
    ) {
      const keyParts = contentData.content.split("/");
      const key = keyParts[keyParts.length - 1];
      const imageDeleteResult = await this.props.apiContent.deleteImage(
        token,
        key
      );
      if (imageDeleteResult.type === "DELETE_IMAGE_SUCCESS") {
        openSnackbar("success", `Deleted ${contentData.content_type}.`);
        this.props.apiContent.getAllContent(token);
      }
    } else if (contentDeleteResult.type === "DELETE_CONTENT_SUCCESS") {
      openSnackbar("success", `Deleted ${contentData.content_type}.`);
      this.props.apiContent.getAllContent(token);
    }
  }

  render() {
    const { classes } = this.props;
    const { loggedIn } = this.props.appState;
    const contentType =
      utils.labelsObj[this.props.content.currentContent.content_type];
    return (
      <div data-test="component-content-library" className={classes.root}>
        {loggedIn && this.props.content.deleteDialogOpen && (
          <AlertDialog
            open={this.props.content.deleteDialogOpen}
            handleClose={this.props.apiContent.handleDeleteClose}
            title="Delete Content"
            content={`Are you sure you want to delete? Note that any live form versions that use this ${contentType} will render the default ${contentType} instead after this is deleted.`}
            danger={true}
            action={() => {
              this.deleteContent(this.props.content.currentContent);
              this.props.apiContent.handleDeleteClose();
            }}
            buttonText="Delete"
            data-test="alert-dialog"
          />
        )}
        <div className={classes.section}>
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            className={classes.head}
            style={{ paddingTop: 20 }}
            data-test="headline"
          >
            Content Library
          </Typography>
          <div className={classes.gridWrapper}>
            {loggedIn &&
              this.props.content.allContent.map(tile => {
                return (
                  <div className={classes.card} key={tile.id} data-test="tile">
                    <div className={classes.actionArea}>
                      <FAB
                        className={classes.buttonDelete}
                        onClick={() => this.handleDeleteDialogOpen(tile)}
                        color="primary"
                        aria-label="Delete Content"
                        data-test="delete"
                      >
                        <Delete />
                      </FAB>
                      <FAB
                        className={classes.buttonEdit}
                        onClick={() =>
                          this.props.history.push(`/edit/${tile.id}`)
                        }
                        color="primary"
                        aria-label="Edit Content"
                        data-test="edit"
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
      </div>
    );
  }
}

ContentLibraryUnconnected.propTypes = {
  classes: PropTypes.object.isRequired,
  appState: PropTypes.shape({
    loggedIn: PropTypes.bool,
    authToken: PropTypes.string
  }),
  content: PropTypes.shape({
    filteredList: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        content_type: PropTypes.string,
        content: PropTypes.string,
        updated_at: PropTypes.string
      })
    ),
    allContent: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        content_type: PropTypes.string,
        content: PropTypes.string,
        updated_at: PropTypes.string
      })
    ),
    currentContent: PropTypes.shape({
      id: PropTypes.number,
      content_type: PropTypes.string,
      content: PropTypes.string,
      updated_at: PropTypes.string
    }),
    deleteDialogOpen: PropTypes.bool,
    apiContent: PropTypes.shape({
      getAllContent: PropTypes.func,
      handleDeleteOpen: PropTypes.func,
      deleteContent: PropTypes.func,
      deleteImage: PropTypes.func
    })
  })
};

const mapStateToProps = state => ({
  appState: state.appState,
  profile: state.profile,
  content: state.content,
  localize: state.localize
});

const mapDispatchToProps = dispatch => ({
  apiContent: bindActionCreators(apiContentActions, dispatch)
});

export const ContentLibraryConnected = connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentLibraryUnconnected);

export default withRouter(withStyles(styles)(ContentLibraryConnected));
