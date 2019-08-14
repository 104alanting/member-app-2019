import React from "react";
import {
  getFormValues,
  submit,
  isSubmitting,
  isPristine,
  isValid,
  getFormSubmitErrors,
  reset
} from "redux-form";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import queryString from "query-string";

import { withStyles } from "@material-ui/core/styles";

import { openSnackbar } from "./Notifier";
import SubmissionFormPage1Wrap from "../components/SubmissionFormPage1Component";
import * as apiSubmissionActions from "../store/actions/apiSubmissionActions";
import * as apiContentActions from "../store/actions/apiContentActions";
import * as apiSFActions from "../store/actions/apiSFActions";

import { stylesPage1, blankSig } from "../components/SubmissionFormElements";
import Modal from "../components/Modal";

export class SubmissionFormPage1Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      tab: undefined,
      legalLanguage: "",
      signatureType: "draw"
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleTab = this.handleTab.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
  }
  componentDidMount() {
    // check for contact id in query string
    const values = queryString.parse(this.props.location.search);
    // if find contact id, call API to fetch contact info for prefill
    if (values.id) {
      const { id } = values;
      this.props.apiSF
        .getSFContactById(id)
        .then(result => {
          // open warning/confirmation modal if prefill successfully loaded
          if (
            this.props.submission.formPage1.firstName &&
            this.props.submission.formPage1.lastName
          ) {
            this.handleOpen();
          }
          // console.log("result.payload", result.payload);
        })
        .catch(err => {
          // console.log(err);
        });
    } else {
      // console.log("no id found, no prefill");
      return;
    }
  }

  handleOpen() {
    const newState = { ...this.state };
    newState.open = true;
    this.setState({ ...newState });
  }

  handleClose() {
    const newState = { ...this.state };
    newState.open = false;
    this.setState({ ...newState });
  }

  handleUpload(firstName, lastName) {
    return new Promise((resolve, reject) => {
      let file = this.trimSignature();
      let filename = `${firstName}_${lastName}_signature_${new Date()}.jpg`;
      if (file instanceof Blob) {
        file.name = filename;
      }
      this.props.apiContent
        .uploadImage(file)
        .then(result => {
          if (
            result.type === "UPLOAD_IMAGE_FAILURE" ||
            this.props.content.error
          ) {
            openSnackbar(
              "error",
              this.props.content.error ||
                "An error occured while trying to save your Signature. Please try typing it instead"
            );
            resolve();
          } else {
            resolve(result.payload.content);
          }
        })
        .catch(err => {
          openSnackbar("error", err);
          reject(err);
        });
    });
  }

  toggleSignatureInputType = () => {
    let value = this.state.signatureType === "draw" ? "write" : "draw";
    this.setState({ signatureType: value });
  };

  clearSignature = () => {
    this.props.sigBox.current.clear();
  };

  dataURItoBlob = dataURI => {
    let binary = atob(dataURI.split(",")[1]);
    let array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: "image/jpeg" });
  };

  trimSignature = () => {
    let dataURL = this.props.sigBox.current.toDataURL("image/jpeg");
    if (dataURL === blankSig) {
      throw "Please draw your signature or click the link to type it instead";
    } else {
      let blobData = this.dataURItoBlob(dataURL);
      return blobData;
    }
  };

  handleTab(event, newValue, formValues) {
    if (newValue === 2) {
      // save legal_language to redux store before ref disappears
      const legalLanguage = this.props.legal_language.current.textContent;
      this.props.apiSubmission.handleInput({
        target: { name: "legalLanguage", value: legalLanguage }
      });
      // perform signature processing steps and save value to redux store
      // before ref disappears
      if (this.state.signatureType === "write") {
        this.props.apiSubmission.handleInput({
          target: { name: "signature", value: formValues.signature }
        });
        const newState = { ...this.state };
        newState.tab = newValue;
        this.setState({ ...newState });
        return;
      }
      if (this.state.signatureType === "draw") {
        this.handleUpload(formValues.firstName, formValues.lastName)
          .then(sigUrl => {
            this.props.apiSubmission.handleInput({
              target: { name: "signature", value: sigUrl }
            });
            const newState = { ...this.state };
            newState.tab = newValue;
            this.setState({ ...newState });
            return;
          })
          .catch(err => {
            openSnackbar("error", err);
          });
      }
    } else {
      const newState = { ...this.state };
      newState.tab = newValue;
      this.setState({ ...newState });
    }
  }

  render() {
    const fullName = `${
      this.props.submission &&
      this.props.submission.formPage1 &&
      this.props.submission.formPage1.firstName
        ? this.props.submission.formPage1.firstName
        : ""
    } ${
      this.props.submission &&
      this.props.submission.formPage1 &&
      this.props.submission.formPage1.lastName
        ? this.props.submission.formPage1.lastName
        : ""
    }`;
    return (
      <div data-test="container-submission-form-page-1">
        <Modal
          open={
            this.state.open &&
            fullName.length &&
            !this.props.submission.redirect
          }
          handleClose={this.handleClose}
          fullName={fullName}
          history={this.props.history}
        />
        <SubmissionFormPage1Wrap
          {...this.props}
          tab={this.state.tab}
          handleTab={this.handleTab}
          handleUpload={this.handleUpload}
          signatureType={this.state.signatureType}
          toggleSignatureInputType={this.toggleSignatureInputType}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  submission: state.submission,
  appState: state.appState,
  content: state.content,
  initialValues: state.submission.formPage1,
  formValues: getFormValues("submissionPage1")(state) || {},
  pristine: isPristine("submissionPage1")(state),
  submitting: isSubmitting("submissionPage1")(state),
  valid: isValid("submissionPage1")(state),
  submitErrors: getFormSubmitErrors("submissionPage1")(state),
  reset: reset
});

const mapDispatchToProps = dispatch => ({
  apiSubmission: bindActionCreators(apiSubmissionActions, dispatch),
  apiContent: bindActionCreators(apiContentActions, dispatch),
  apiSF: bindActionCreators(apiSFActions, dispatch),
  submitForm: () => dispatch(submit("submissionPage1"))
});

export const SubmissionFormPage1Connected = connect(
  mapStateToProps,
  mapDispatchToProps
)(SubmissionFormPage1Container);

export default withStyles(stylesPage1)(SubmissionFormPage1Connected);
