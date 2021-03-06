import React from "react";
import {
  getFormValues,
  submit,
  isSubmitting,
  isPristine,
  isValid,
  getFormSubmitErrors,
  reset,
  change
} from "redux-form";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import queryString from "query-string";
import isoConv from "iso-language-converter";

import { withStyles } from "@material-ui/core/styles";

import { openSnackbar } from "./Notifier";
import SubmissionFormPage1Wrap from "../components/SubmissionFormPage1Component";
import * as utils from "../utils";
import * as apiSubmissionActions from "../store/actions/apiSubmissionActions";
import * as apiContentActions from "../store/actions/apiContentActions";
import * as apiSFActions from "../store/actions/apiSFActions";
import * as actions from "../store/actions";

import {
  stylesPage1,
  blankSig,
  formatSFDate,
  formatBirthdate,
  findEmployerObject,
  handleError,
  generateCAPEOptions
} from "../components/SubmissionFormElements";
import Modal from "../components/Modal";
const uuid = require("uuid");

export class SubmissionFormPage1Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      capeOpen: false,
      tab: undefined,
      legalLanguage: "",
      signatureType: "draw",
      howManyTabs: 3,
      displayCAPEPaymentFields: false,
      prefillEmployerChanged: false
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleTab = this.handleTab.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.prepForContact = this.prepForContact.bind(this);
    this.prepForSubmission = this.prepForSubmission.bind(this);
    this.generateSubmissionBody = this.generateSubmissionBody.bind(this);
    this.toggleCardAddingFrame = this.toggleCardAddingFrame.bind(this);
    this.handleCAPESubmit = this.handleCAPESubmit.bind(this);
    this.suggestedAmountOnChange = this.suggestedAmountOnChange.bind(this);
    this.verifyRecaptchaScore = this.verifyRecaptchaScore.bind(this);
    this.saveSubmissionErrors = this.saveSubmissionErrors.bind(this);
    this.handleEmployerTypeChange = this.handleEmployerTypeChange.bind(this);
    this.handleEmployerChange = this.handleEmployerChange.bind(this);
    this.lookupSFContact = this.lookupSFContact.bind(this);
    this.handleDonationFrequencyChange = this.handleDonationFrequencyChange.bind(
      this
    );
    this.checkCAPEPaymentLogic = this.checkCAPEPaymentLogic.bind(this);
    this.handleCAPEOpen = this.handleCAPEOpen.bind(this);
    this.handleCAPEClose = this.handleCAPEClose.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
    this.mobilePhoneOnBlur = this.mobilePhoneOnBlur.bind(this);
    this.handleCloseAndClear = this.handleCloseAndClear.bind(this);
  }

  componentDidMount() {
    // check for contact & account ids in query string
    const params = queryString.parse(this.props.location.search);
    // if find both ids, call API to fetch contact info for prefill
    if (params.cId && params.aId) {
      const { cId, aId } = params;
      this.props.apiSF
        .getSFContactByDoubleId(cId, aId)
        .then(result => {
          // console.log(result);
          // open warning/confirmation modal if prefill successfully loaded
          if (
            this.props.submission.formPage1.firstName &&
            this.props.submission.formPage1.lastName
          ) {
            this.handleOpen();
            this.setCAPEOptions();
          } else {
            // if prefill lookup fails, remove ids from query params
            // and reset to blank form
            this.props.apiSubmission.clearForm();
            // remove cId & aId from route params if no match
            window.history.replaceState(
              null,
              null,
              `${window.location.origin}/`
            );
          }
        })
        .catch(err => {
          console.error(err);
          this.props.apiSubmission.clearForm();
          // remove cId & aId from route params if no match
          window.history.replaceState(null, null, `${window.location.origin}/`);
          return handleError(err);
        });
    }
  }

  handleOpen() {
    const newState = { ...this.state };
    newState.open = true;
    this.setState({ ...newState });
  }

  handleCAPEOpen() {
    const newState = { ...this.state };
    newState.capeOpen = true;
    this.setState({ ...newState });
  }

  handleClose() {
    const newState = { ...this.state };
    newState.open = false;
    this.setState({ ...newState });
  }

  handleCloseAndClear() {
    const newState = { ...this.state };
    newState.open = false;
    this.setState({ ...newState });
    this.props.apiSubmission.clearForm();
    // remove cId & aId from route params if no match
    window.history.replaceState(null, null, `${window.location.origin}/`);
  }

  handleCAPEClose() {
    const newState = { ...this.state };
    newState.capeOpen = false;
    this.setState({ ...newState });
  }

  closeDialog() {
    this.props.history.push(
      `/page2/?cId=${this.props.submission.salesforceId}&sId=${
        this.props.submission.submissionId
      }`
    );
    this.handleCAPEClose();
  }
  mobilePhoneOnBlur() {
    this.handleEmployerTypeChange(this.props.formValues.employerType);
  }

  handleUpload(firstName, lastName) {
    return new Promise((resolve, reject) => {
      let file = this.trimSignature();
      let filename = `${firstName}_${lastName}__signature__${formatSFDate(
        new Date()
      )}.jpg`;
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
            resolve(
              handleError(
                this.props.content.error ||
                  "An error occurred while trying to save your Signature. Please try typing it instead"
              )
            );
          } else {
            // console.log(result.payload.content);
            resolve(result.payload.content);
          }
        })
        .catch(err => {
          console.error(err);
          resolve(handleError(err));
        });
    });
  }

  suggestedAmountOnChange = e => {
    // call getIframeURL for
    // standalone CAPE when donation amount is set and
    // member shortId does not yet exist
    // console.log("suggestedAmountOnChange");
    const { formValues } = this.props;
    if (e.target.value === "Other") {
      return;
    }
    const params = queryString.parse(this.props.location.search);

    if (
      (params.cape &&
        utils.isPaymentRequired(
          this.props.submission.formPage1.employerType
        )) ||
      formValues.donationFrequency === "One-Time"
    ) {
      this.props.apiSubmission.handleInput({
        target: "paymentRequired",
        value: true
      });
      this.getIframeURL(params.cape).catch(err => {
        console.log(err);
      });
    } else {
      this.props.apiSubmission.handleInput({
        target: "paymentRequired",
        value: false
      });
    }
  };

  async handleEmployerTypeChange(employerType) {
    console.log("handleEmployerTypeChange");
    console.log(employerType);
    // render iframe if payment required
    if (utils.isPaymentRequired(employerType)) {
      await this.props.apiSubmission.handleInput({
        target: { name: "paymentRequired", value: true }
      });
      await this.props.apiSubmission.handleInput({
        target: { name: "checkoff", value: false }
      });
      const params = queryString.parse(this.props.location.search);
      return this.getIframeURL(params.cape);
    } else {
      console.log("setting paymentRequired to false");
      // hide iframe if already rendered if change to checkoff
      await this.props.apiSubmission.handleInput({
        target: { name: "paymentRequired", value: false }
      });
      await this.props.apiSubmission.handleInput({
        target: { name: "checkoff", value: true }
      });
    }
  }

  handleEmployerChange() {
    // console.log("handleEmployerChange");
    // track that employer has been manually changed after prefill
    // to send the prefilled value back to SF on submit if no change
    const newState = { ...this.state };
    newState.prefillEmployerChanged = true;
    this.setState({ ...newState });
  }

  async handleDonationFrequencyChange(frequency) {
    const { formValues } = this.props;
    const { payment, cape } = this.props.submission;
    const activeMethodLast4 =
      payment.activeMethodLast4 || cape.activeMethodLast4;
    const paymentErrorHold = payment.paymentErrorHold || cape.paymentErrorHold;
    const validMethod = !!activeMethodLast4 && !paymentErrorHold;
    if (!formValues.capeAmount && !formValues.capeAmountOther) {
      return;
    }
    // render iframe if one-time donation and cape amount set

    if (validMethod) {
      await this.props.apiSubmission.handleInput({
        target: { name: "newCardNeeded", value: false }
      });
    }

    if (frequency === "One-Time") {
      await this.props.apiSubmission.handleInput({
        target: { name: "paymentRequired", value: true }
      });

      return this.getIframeURL(true);
    } else {
      const checkoff = this.props.submission.formPage1.checkoff;
      console.log(checkoff);
      if (frequency === "Monthly" && checkoff) {
        // hide iframe if already rendered
        // if change back to monthly and checkoff
        console.log("setting paymentRequired to false, hiding iframe");
        await this.props.apiSubmission.handleInput({
          target: { name: "paymentRequired", value: false }
        });
      }
    }
  }

  async setCAPEOptions() {
    const existingCAPE = this.props.submission.payment.currentCAPEFromSF;
    const { monthlyOptions, oneTimeOptions } = generateCAPEOptions(
      existingCAPE
    );
    await this.props.apiSubmission.setCAPEOptions({
      monthlyOptions,
      oneTimeOptions
    });
  }

  toggleSignatureInputType = () => {
    let type = this.state.signatureType === "draw" ? "write" : "draw";
    this.setState({ signatureType: type });
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
      return handleError(
        "Please draw your signature or click the link to type it instead"
      );
    } else {
      let blobData = this.dataURItoBlob(dataURL);
      return blobData;
    }
  };

  async saveSubmissionErrors(submission_id, method, error) {
    // 1. retrieve existing errors array from current submission
    let { submission_errors } = this.props.submission.currentSubmission;
    if (submission_errors === null) {
      submission_errors = "";
    }
    // 2. add new data to string
    submission_errors += `Attempted method: ${method}, Error: ${error}. `;
    // 3. update submission_errors and submission_status on submission by id
    const updates = {
      submission_errors,
      submission_status: "error"
    };
    this.props.apiSubmission
      .updateSubmission(submission_id, updates)
      .then(result => {
        // console.log(result.type);
        if (
          result.type === "UPDATE_SUBMISSION_FAILURE" ||
          this.props.submission.error
        ) {
          // console.log(this.props.submission.error);
          return handleError(this.props.submission.error);
        }
        // console.log(result.type);
      })
      .catch(err => {
        console.error(err);
        return handleError(err);
      });
  }

  async prepForContact(values) {
    return new Promise(resolve => {
      let returnValues = { ...values };

      // format birthdate
      let birthdate;
      if (values.mm && values.dd && values.yyyy) {
        birthdate = formatBirthdate(values);
      }

      returnValues.birthdate = birthdate;
      // find employer object and set employer-related fields
      let employerObject = findEmployerObject(
        this.props.submission.employerObjects,
        values.employerName
      );

      if (employerObject) {
        returnValues.agencyNumber = employerObject.Agency_Number__c;
      } else if (values.employerName === "SEIU 503 Staff") {
        employerObject = findEmployerObject(
          this.props.submission.employerObjects,
          "SEIU LOCAL 503 OPEU"
        );
        returnValues.agencyNumber = employerObject.Agency_Number__c;
      } else {
        console.log(`no agency number found for ${values.employerName}`);
        returnValues.agencyNumber = 0;
      }

      if (
        this.props.submission.formPage1 &&
        this.props.submission.formPage1.prefillEmployerId
      ) {
        if (!this.state.prefillEmployerChanged) {
          // if this is a prefill and employer has not been changed manually,
          // return original prefilled employer Id
          // this will be a worksite-level account id in most cases
          returnValues.employerId = this.props.submission.formPage1.prefillEmployerId;
        } else {
          // if employer has been manually changed since prefill, or if
          // this is a blank-slate form, find id in employer object
          // this will be an agency-level employer Id
          returnValues.employerId = employerObject
            ? employerObject.Id
            : "0016100000WERGeAAP"; // <= unknown employer
        }
      } else {
        // if employer has been manually changed since prefill, or if
        // this is a blank-slate form, find id in employer object
        // this will be an agency-level employer Id
        returnValues.employerId = employerObject
          ? employerObject.Id
          : "0016100000WERGeAAP"; // <= unknown employer
      }
      // save employerId to redux store for later
      this.props.apiSubmission.handleInput({
        target: { name: "employerId", value: returnValues.employerId }
      });
      resolve(returnValues);
    });
  }

  prepForSubmission(values) {
    return new Promise(resolve => {
      let returnValues = { ...values };

      // set default date values for DPA & DDA if relevant
      returnValues.direct_pay_auth = values.directPayAuth
        ? formatSFDate(new Date())
        : null;
      returnValues.direct_deposit_auth = values.directDepositAuth
        ? formatSFDate(new Date())
        : null;
      // set legal language
      returnValues.legalLanguage = this.props.submission.formPage1.legalLanguage;
      // set campaign source
      const q = queryString.parse(this.props.location.search);
      returnValues.campaignSource = q && q.s ? q.s : "NewMemberForm_201910";
      // set salesforce id
      if (!values.salesforceId) {
        if (q && q.cId) {
          returnValues.salesforceId = q.cId;
        }
        if (this.props.submission.salesforce_id) {
          returnValues.salesforceId = this.props.submission.salesforce_id;
        }
      }
      resolve(returnValues);
    });
  }

  async generateSubmissionBody(values) {
    const firstValues = await this.prepForContact(values);
    const secondValues = await this.prepForSubmission(firstValues);
    secondValues.termsAgree = values.termsAgree;
    secondValues.signature = this.props.submission.formPage1.signature;
    secondValues.legalLanguage = this.props.submission.formPage1.legalLanguage;
    secondValues.reCaptchaValue = this.props.submission.formPage1.reCaptchaValue;

    let {
      firstName,
      lastName,
      birthdate,
      employerId,
      agencyNumber,
      preferredLanguage,
      homeStreet,
      homeZip,
      homeState,
      homeCity,
      homeEmail,
      mobilePhone,
      employerName,
      textAuthOptOut,
      immediatePastMemberStatus,
      direct_pay_auth,
      direct_deposit_auth,
      salesforceId,
      termsAgree,
      campaignSource,
      legalLanguage,
      signature,
      reCaptchaValue
    } = secondValues;

    return {
      submission_date: new Date(),
      agency_number: agencyNumber,
      birthdate,
      cell_phone: mobilePhone,
      employer_name: employerName,
      employer_id: employerId,
      first_name: firstName,
      last_name: lastName,
      home_street: homeStreet,
      home_city: homeCity,
      home_state: homeState,
      home_zip: homeZip,
      home_email: homeEmail,
      preferred_language: preferredLanguage,
      terms_agree: termsAgree,
      signature: signature,
      text_auth_opt_out: textAuthOptOut,
      online_campaign_source: campaignSource,
      legal_language: legalLanguage,
      maintenance_of_effort: new Date(),
      seiu503_cba_app_date: new Date(),
      direct_pay_auth,
      direct_deposit_auth,
      immediate_past_member_status: immediatePastMemberStatus,
      salesforce_id: salesforceId || this.props.submission.salesforceId,
      reCaptchaValue
    };
  }

  async createSubmission() {
    // console.log("createSubmission");
    const { formValues } = this.props;

    // create initial submission using data in tabs 1 & 2
    // for afh/retiree/comm, submission will not be
    // finalized and written to salesforce
    // until payment method added in tab 3

    const body = await this.generateSubmissionBody(formValues);
    // console.log(body.ip_address);
    await this.props.apiSubmission
      // const result = await this.props.apiSubmission
      .addSubmission(body)
      .then(() => {
        // console.log('453');
      })
      .catch(err => {
        console.error(err);
        return handleError(err);
      });

    // if no payment is required, we're done with saving the submission
    // we can write the OMA to SF and then move on to the CAPE ask
    if (!this.props.submission.formPage1.paymentRequired) {
      // console.log("no payment required, writing OMA to SF and on to CAPE");
      body.Worker__c = this.props.submission.salesforceId;
      return this.props.apiSF
        .createSFOMA(body)
        .then(result => {
          // console.log(result.type);
          if (
            result.type !== "CREATE_SF_OMA_SUCCESS" ||
            this.props.submission.error
          ) {
            this.saveSubmissionErrors(
              this.props.submission.submissionId,
              "createSFOMA",
              this.props.submission.error
            );
            // goto CAPE tab
            this.changeTab(this.props.howManyTabs - 1);
          } else if (!this.props.submission.error) {
            // update submission status and redirect to CAPE tab
            // console.log("updating submission status");
            this.props.apiSubmission
              .updateSubmission(this.props.submission.submissionId, {
                submission_status: "Success"
              })
              .then(result => {
                console.log(result.type);
                if (
                  result.type === "UPDATE_SUBMISSION_FAILURE" ||
                  this.props.submission.error
                ) {
                  console.log(this.props.submission.error);
                  return this.props.handleError(this.props.submission.error);
                } else {
                  this.changeTab(2);
                }
              })
              .catch(err => {
                console.error(err);
                return this.props.handleError(err);
              });
          }
        })
        .catch(err => {
          this.saveSubmissionErrors(
            this.props.submission.submissionId,
            "createSFOMA",
            err
          );
          console.error(err);
          return handleError(err);
        });
    }
    // if payment required, return out of this function and move to next tab
    return;
  }

  // lookup SF Contact by first, last, email; if none found then create new
  async lookupSFContact() {
    const { formValues } = this.props;
    if (
      formValues.firstName &&
      formValues.lastName &&
      formValues.homeEmail &&
      formValues.employerName &&
      !this.props.submission.salesforceId
    ) {
      // lookup contact by first/last/email
      const lookupBody = {
        first_name: formValues.firstName,
        last_name: formValues.lastName,
        home_email: formValues.homeEmail
        // employer_id: this.props.submission.formPage1.employerId
      };
      await this.props.apiSF
        .lookupSFContact(lookupBody)
        .then(() => {
          this.setCAPEOptions();
        })
        .catch(err => {
          console.error(err);
          return handleError(err);
        });

      // if nothing found on lookup, need to create new contact
      if (!this.props.submission.salesforceId) {
        await this.createSFContact()
          .then(() => {
            // console.log(this.props.submission.salesforceId);
          })
          .catch(err => {
            console.error(err);
            return handleError(err);
          });
      }
    }
  }

  async createSFContact() {
    // console.log("createSFContact");
    const values = await this.prepForContact(this.props.formValues);
    let {
      firstName,
      lastName,
      birthdate,
      employerId,
      agencyNumber,
      preferredLanguage,
      homeStreet,
      homeZip,
      homeState,
      homeCity,
      homeEmail,
      mobilePhone,
      employerName,
      textAuthOptOut,
      reCaptchaValue
    } = values;

    const body = {
      agency_number: agencyNumber,
      birthdate,
      cell_phone: mobilePhone,
      employer_name: employerName,
      employer_id: employerId,
      first_name: firstName,
      last_name: lastName,
      home_street: homeStreet,
      home_city: homeCity,
      home_state: homeState,
      home_zip: homeZip,
      home_email: homeEmail,
      preferred_language: preferredLanguage,
      text_auth_opt_out: textAuthOptOut,
      reCaptchaValue
    };

    await this.props.apiSF.createSFContact(body).catch(err => {
      console.error(err);
      return handleError(err);
    });
  }

  async updateSFContact() {
    const values = await this.prepForContact(this.props.formValues);
    let {
      firstName,
      lastName,
      birthdate,
      employerId,
      agencyNumber,
      preferredLanguage,
      homeStreet,
      homeZip,
      homeState,
      homeCity,
      homeEmail,
      mobilePhone,
      employerName,
      textAuthOptOut,
      reCaptchaValue
    } = values;

    let id = this.props.submission.salesforceId;

    const body = {
      agency_number: agencyNumber,
      birthdate,
      cell_phone: mobilePhone,
      employer_name: employerName,
      employer_id: employerId,
      first_name: firstName,
      last_name: lastName,
      home_street: homeStreet,
      home_city: homeCity,
      home_state: homeState,
      home_zip: homeZip,
      home_email: homeEmail,
      preferred_language: preferredLanguage,
      text_auth_opt_out: textAuthOptOut,
      reCaptchaValue
    };

    await this.props.apiSF.updateSFContact(id, body).catch(err => {
      console.error(err);
      return handleError(err);
    });
  }

  async getCAPEBySFId() {
    const id = this.props.submission.salesforceId;
    if (id) {
      return new Promise(resolve => {
        this.props.apiSubmission
          .getCAPEBySFId(id)
          .then(result => {
            if (
              result.type === "GET_CAPE_BY_SFID_FAILURE" ||
              this.props.submission.error
            ) {
              // console.log(this.props.submission.error);
              // don't return this error to client
              // it's confusing if it's just 'no record found'...
              resolve(console.log(this.props.submission.error));
            }
            resolve(result);
          })
          .catch(err => {
            console.error(err);
            resolve(handleError(err));
          });
      });
    }
  }

  async getSFCAPEByContactId() {
    // console.log("getSFCAPEByContactId");
    const id = this.props.submission.salesforceId;
    // console.log(id);
    await this.props.apiSF
      .getSFCAPEByContactId(id)
      .then(result => {
        // console.log(result);
        if (
          result.type === "GET_SF_CAPE_BY_CONTACT_ID_FAILURE" ||
          this.props.submission.error
        ) {
          // console.log(this.props.submission.error);
          this.props.apiSubmission.handleInput({
            target: { name: "whichCard", value: "Add new card" }
          });
          return handleError(this.props.submission.error);
        }
        if (
          !!this.props.submission.cape.activeMethodLast4 &&
          !this.props.submission.cape.paymentErrorHold
        ) {
          this.props.apiSubmission.handleInput({
            target: { name: "whichCard", value: "Use existing" }
          });
        }
        return result;
      })
      .catch(err => {
        console.error(err);
        return handleError(err);
      });
  }

  getSFDJRById() {
    const id = this.props.submission.salesforceId;
    return new Promise(resolve => {
      this.props.apiSF
        .getSFDJRById(id)
        .then(result => {
          // console.log(result);
          if (
            result.type === "GET_SF_DJR_FAILURE" ||
            this.props.submission.error
          ) {
            // console.log(this.props.submission.error);
            this.props.apiSubmission.handleInput({
              target: { name: "whichCard", value: "Add new card" }
            });
            resolve(handleError(this.props.submission.error));
          }
          if (
            !!this.props.submission.payment.activeMethodLast4 &&
            !this.props.submission.payment.paymentErrorHold
          ) {
            this.props.apiSubmission.handleInput({
              target: { name: "whichCard", value: "Use existing" }
            });
          }
          resolve(result);
        })
        .catch(err => {
          console.error(err);
          resolve(handleError(err));
        });
    });
  }

  async createSFDJR() {
    const medicaidResidents =
      this.props.submission.formPage1.medicaidResidents || 0;
    const body = {
      Worker__c: this.props.submission.salesforceId,
      Unioni_se_MemberID__c: this.props.submission.payment.memberShortId,
      Payment_Method__c: this.props.submission.formPage1.paymentType,
      AFH_Number_of_Residents__c: medicaidResidents
    };
    this.props.apiSF
      .createSFDJR(body)
      .then(result => {
        // console.log(result);
        if (
          result.type === "CREATE_SF_DJR_FAILURE" ||
          this.props.submission.error
        ) {
          return handleError(this.props.submission.error);
        }
      })
      .catch(err => {
        console.error(err);
        return handleError(err);
      });
  }

  async updateSFDJR() {
    const id = this.props.submission.salesforceId;
    const medicaidResidents =
      this.props.submission.formPage1.medicaidResidents || 0;
    const updates = {
      Unioni_se_MemberID__c: this.props.submission.payment.memberShortId,
      Payment_Method__c: this.props.submission.formPage1.paymentType,
      AFH_Number_of_Residents__c: medicaidResidents,
      Active_Account_Last_4__c: this.props.submission.payment.activeMethodLast4,
      Card_Brand__c: this.props.submission.payment.cardBrand
    };
    // console.log("is Card_Brand__c populated here?");
    // console.log(updates);
    this.props.apiSF
      .updateSFDJR(id, updates)
      .then(result => {
        // console.log(result.payload);
        if (
          result.type === "UPDATE_SF_DJR_FAILURE" ||
          this.props.submission.error
        ) {
          // console.log(this.props.submission.error);
          return handleError(this.props.submission.error);
        }
      })
      .catch(err => {
        console.error(err);
        return handleError(err);
      });
  }

  async verifyRecaptchaScore() {
    // fetch token
    await this.props.recaptcha.execute();

    // then verify
    const token = this.props.submission.formPage1.reCaptchaValue;

    // check for token every 200ms until returned to avoid race condition
    (async () => {
      while (!token) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    })();
    if (token) {
      const result = await this.props.apiSubmission.verify(token).catch(err => {
        console.error(err);
        return handleError(
          "ReCaptcha verification failed, please reload the page and try again."
        );
      });

      if (result) {
        // console.log(`recaptcha score: ${result.payload.score}`);
        return result.payload.score;
      }
    }
  }

  async getIframeExisting() {
    // console.log("getIframeExisting");
    const memberShortId =
      this.props.submission.payment.memberShortId ||
      this.props.submission.cape.memberShortId;
    const token = this.props.submission.payment.unioniseToken;
    return this.props.apiSF
      .getIframeExisting(token, memberShortId)
      .then(result => {
        // console.log(result);
        if (
          !result.payload.cardAddingUrl ||
          result.payload.message ||
          result.type === "GET_IFRAME_EXISTING_FAILURE"
        ) {
          // console.log(this.props.submission.error);
          return handleError(
            result.payload.message ||
              this.props.submission.error ||
              "Sorry, something went wrong. Please try again."
          );
        }
      })
      .catch(err => {
        console.error(err);
        return handleError(err);
      });
  }

  async getIframeNew(cape, capeAmount, capeAmountOther) {
    // console.log("getIframeNew");
    // console.log(capeAmount, capeAmountOther);
    const { formValues } = this.props;

    let birthdate;
    if (formValues.mm && formValues.dd && formValues.yyyy) {
      birthdate = formatBirthdate(formValues);
    }

    if (!formValues.preferredLanguage) {
      formValues.preferredLanguage = "English";
    }
    // convert language to ISO code for unioni.se
    let language = isoConv(formValues.preferredLanguage);
    if (language === "en") {
      language = "en-US";
    }
    if (language === "es") {
      language = "es-US";
    }

    // also make route for createPaymentRequest
    // writePaymentStatus back to our api

    let externalId;
    // console.log(`submissionId: ${this.props.submission.submissionId}`);
    if (this.props.submission.submissionId) {
      // console.log("found submission id");
      externalId = this.props.submission.submissionId;
    } else if (this.props.submission.cape.id) {
      // console.log("found cape id");
      externalId = this.props.submission.cape.id;
    } else {
      externalId = uuid();
    }

    // find employer object
    let employerObject = findEmployerObject(
      this.props.submission.employerObjects,
      formValues.employerName
    );
    if (employerObject) {
      console.log(`Agency #: ${employerObject.Agency_Number__c}`);
    } else if (formValues.employerName === "SEIU 503 Staff") {
      employerObject = findEmployerObject(
        this.props.submission.employerObjects,
        "SEIU LOCAL 503 OPEU"
      );
    } else {
      console.log(
        `no employerObject found for ${formValues.employerName}; no agency #`
      );
    }

    const employerExternalId =
      employerObject && employerObject.Agency_Number__c
        ? employerObject.Agency_Number__c.toString()
        : "SW001";

    const body = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      address: {
        addressLine1: formValues.homeStreet,
        city: formValues.homeCity,
        state: formValues.homeState,
        zip: formValues.homeZip
      },
      email: formValues.homeEmail,
      cellPhone: formValues.mobilePhone,
      birthDate: birthdate,
      employerExternalId: employerExternalId,
      agreesToMessages: !formValues.textAuthOptOut,
      employeeExternalId: externalId
    };
    // console.log(body);

    if (!cape) {
      body.language = language;
    } else {
      // console.log("generating body for CAPE iFrame request");
      const donationAmount =
        capeAmount === "Other"
          ? parseFloat(capeAmountOther)
          : parseFloat(capeAmount);
      // console.log(donationAmount);
      body.deductionType = "CAPE";
      body.politicalType = "monthly";
      body.deductionAmount = donationAmount;
      body.deductionCurrency = "USD";
      body.deductionDayOfMonth = 10;
    }
    // console.log(JSON.stringify(body));

    this.props.apiSF
      .getIframeURL(body)
      .then(result => {
        // if unionise memberShortId already exists, then try again
        // and get existing
        // if (result.payload && result.payload.message.includes("Member with employeeExternalId")) {
        //   console.log('unionise acct already exists, trying again to fetch new');
        //   return this.getIframeURL(cape);
        // }
        if (
          !result.payload.cardAddingUrl ||
          result.payload.message ||
          result.type === "GET_IFRAME_URL_FAILURE"
        ) {
          // console.log(this.props.submission.error);
          return handleError(
            result.payload.message ||
              this.props.submission.error ||
              "Sorry, something went wrong. Please try again."
          );
        }
      })
      .catch(err => {
        console.error(err);
        return handleError(err);
      });
  }

  async getUnioniseToken() {
    // console.log("getUnioniseToken");
    return this.props.apiSF
      .getUnioniseToken()
      .then(result => {
        // console.log(result.payload);
        if (
          !result.payload.access_token ||
          result.payload.message ||
          result.type === "GET_UNIONISE_TOKEN_FAILURE"
        ) {
          // console.log(this.props.submission.error);
          return handleError(
            result.payload.message ||
              this.props.submission.error ||
              "Sorry, something went wrong. Please try again."
          );
        }
        // return the access token to calling function
        return result.payload.access_token;
      })
      .catch(err => {
        console.error(err);
        return handleError(err);
      });
  }

  async getIframeURL(cape) {
    // console.log("getIframeURL");
    // first check if we have an existing unionise id
    // if so, we don't need to create a unionise member account; just fetch a
    // cardAddingURL from existing account
    let memberShortId =
      this.props.submission.payment.memberShortId ||
      this.props.submission.cape.memberShortId;
    console.log(`memberShortId: ${memberShortId}`);
    const { formValues } = this.props;
    let capeAmount;
    if (cape) {
      capeAmount =
        formValues.capeAmount === "Other"
          ? parseFloat(formValues.capeAmountOther)
          : parseFloat(formValues.capeAmount);
    }
    if (!this.props.submission.salesforceId) {
      // console.log("lookup sf contact");
      await this.lookupSFContact();
    }
    if (!memberShortId && cape && this.props.submission.salesforceId) {
      // check if existing postgres CAPE OR SFDJR to fetch memberShortId
      console.log("FETCHING SFCAPE BY CONTACT ID");
      await this.getSFCAPEByContactId();
      await this.getSFDJRById();
      memberShortId =
        this.props.submission.payment.memberShortId ||
        this.props.submission.cape.memberShortId;
      console.log(`memberShortId: ${memberShortId}`);
    }
    if (memberShortId) {
      // console.log("found memberShortId, getting unionise auth token");
      // first fetch an auth token to access secured unionise routes
      const access_token = await this.props.apiSF
        .getUnioniseToken()
        .catch(err => {
          console.error(err);
          return handleError(err);
        });
      // then get the card adding url for the existing account
      return this.getIframeExisting(access_token, memberShortId);
    } else {
      // console.log("########  no memberShortId found");
    }

    // if we don't have the memberShortId, then we need to create a new
    // unionise member record and return the cardAddingUrl
    return this.getIframeNew(cape, capeAmount).catch(err => {
      console.error(err);
    });
  }

  async saveLegalLanguage() {
    const { formValues } = this.props;
    // save legal_language to redux store before ref disappears
    let legalLanguage = this.props.legal_language.current.innerHTML;
    if (formValues.directDepositAuth && this.props.direct_deposit.current) {
      legalLanguage = legalLanguage.concat(
        "<hr>",
        this.props.direct_deposit.current.innerHTML
      );
    }
    if (formValues.directPayAuth && this.props.direct_pay.current) {
      legalLanguage = legalLanguage.concat(
        "<hr>",
        this.props.direct_pay.current.innerHTML
      );
    }
    this.props.apiSubmission.handleInput({
      target: { name: "legalLanguage", value: legalLanguage }
    });
  }

  async calculateAFHDuesRate(medicaidResidents) {
    // console.log("calculateAFHDuesRate");
    // console.log(`medicaidResidents: ${medicaidResidents}`);
    let afhDuesRate = medicaidResidents * 14.84 + 2.75;
    // console.log(`afhDuesRate: ${afhDuesRate}`);
    this.props.apiSubmission.handleInput({
      target: { name: "afhDuesRate", value: afhDuesRate }
    });
  }

  async toggleCardAddingFrame(value) {
    // console.log("toggleCardAddingFrame");
    // console.log(value);
    if (value === "Add new card" || value === "Card") {
      await this.getIframeURL()
        // .then(() => console.log("got iFrameURL"))
        .catch(err => {
          console.error(err);
          return handleError(err);
        });
      this.props.apiSubmission.handleInput({
        target: { name: "paymentMethodAdded", value: false }
      });
      // console.log(
      //   `paymentMethodAdded 1058: ${
      //     this.props.submission.formPage1.paymentMethodAdded
      //   }`
      // );
      return this.props.apiSubmission.handleInput({
        target: { name: "newCardNeeded", value: true }
      });
    }
    this.props.apiSubmission.handleInput({
      target: { name: "paymentMethodAdded", value: true }
    });
    if (value === "Card" || value === "Check") {
      this.props.apiSubmission.handleInput({
        target: { name: "paymentType", value }
      });
    }
    if (value === "Use Existing" || value === "Check") {
      console.log("setting nCN to false, hiding iframe");
      return this.props.apiSubmission.handleInput({
        target: { name: "newCardNeeded", value: false }
      });
    }
  }

  async saveSignature() {
    const { formValues } = this.props;
    // perform signature processing steps and save value to redux store
    // before ref disappears

    if (this.state.signatureType === "draw") {
      const sigUrl = await this.handleUpload(
        formValues.firstName,
        formValues.lastName
      ).catch(err => {
        console.error(err);
        return handleError(err);
      });
      // console.log(`748: ${sigUrl}`);
      this.props.apiSubmission.handleInput({
        target: { name: "signature", value: sigUrl }
      });
      return sigUrl;
    }
    return formValues.signature;
  }

  async postOneTimePayment() {
    // console.log("postOneTimePayment");
    const { formValues } = this.props;
    const donationAmount =
      formValues.capeAmount === "Other"
        ? parseFloat(formValues.capeAmountOther)
        : parseFloat(formValues.capeAmount);
    const memberShortId =
      this.props.submission.payment.memberShortId ||
      this.props.submission.cape.memberShortId;
    const body = {
      memberShortId,
      amount: {
        currency: "USD",
        amount: donationAmount
      },
      paymentPartType: "CAPE",
      description: "One-Time CAPE Contribution",
      plannedDatetime: new Date()
    };
    // console.log(body);

    const result = await this.props.apiSF.getUnioniseToken().catch(err => {
      console.error(err);
      return handleError(err);
    });

    // console.log(`access_token: ${!!result.payload.access_token}`);
    // console.log(result.payload.access_token);
    const oneTimePaymentResult = await this.props.apiSF
      .postOneTimePayment(result.payload.access_token, body)
      .catch(err => {
        console.error(err);
        return handleError(err);
      });

    if (
      oneTimePaymentResult.type !== "POST_ONE_TIME_PAYMENT_SUCCESS" ||
      this.props.submission.error
    ) {
      // console.log(this.props.submission.error);
      return handleError(this.props.submission.error);
    }
  }

  async checkCAPEPaymentLogic() {
    // console.log("checkCAPEPaymentLogic");
    const { formValues } = this.props;

    await this.handleEmployerTypeChange(formValues.employerType);
    await this.handleDonationFrequencyChange(formValues.donationFrequency);

    const newState = { ...this.state };
    newState.displayCAPEPaymentFields = true;
    this.setState(newState, () => {
      // console.log(this.state.displayCAPEPaymentFields);
    });
  }

  async generateCAPEBody(capeAmount, capeAmountOther) {
    // console.log("generateCAPEBody");
    // console.log(capeAmount, capeAmountOther);
    const { formValues } = this.props;

    // if no contact in prefill or from previous form tabs...
    if (!this.props.submission.salesforceId) {
      await this.lookupSFContact();
    }

    // find employer object
    let employerObject = findEmployerObject(
      this.props.submission.employerObjects,
      formValues.employerName
    );

    if (employerObject) {
      // console.log(`employerId: ${employerObject.Id}`);
    } else if (formValues.employerName === "SEIU 503 Staff") {
      employerObject = findEmployerObject(
        this.props.submission.employerObjects,
        "SEIU LOCAL 503 OPEU"
      );
    } else {
      console.log(
        `no employerObject found for ${formValues.employerName}; no agency #`
      );
    }
    // console.log(employerObject);
    // decide whether to use prefilled employer id (worksite level),
    // or user-chosen employer id (employer level)
    let employerId;
    if (
      this.props.submission.formPage1 &&
      this.props.submission.formPage1.prefillEmployerId
    ) {
      if (!this.state.prefillEmployerChanged) {
        // if this is a prefill and employer has not been changed manually,
        // return original prefilled employer Id
        // this will be a worksite-level account id in most cases
        employerId = this.props.submission.formPage1.prefillEmployerId;
      } else {
        // if employer has been manually changed since prefill, or if
        // this is a blank-slate form, find id in employer object
        // this will be an agency-level employer Id
        employerId = employerObject ? employerObject.Id : "0016100000WERGeAAP"; // <= unknown employer
      }
    } else {
      // if employer has been manually changed since prefill, or if
      // this is a blank-slate form, find id in employer object
      // this will be an agency-level employer Id
      employerId = employerObject ? employerObject.Id : "0016100000WERGeAAP"; // <= unknown employer
    }

    // set campaign source
    const q = queryString.parse(this.props.location.search);
    const campaignSource = q && q.s ? q.s : "Direct seiu503signup";

    // set body fields
    const checkoff = this.props.submission.formPage1.checkoff;
    const oneTime = formValues.donationFrequency === "One-Time";
    const paymentMethod = checkoff && !oneTime ? "Checkoff" : "Unionise";
    let donationAmount =
      capeAmount === "Other"
        ? parseFloat(capeAmountOther)
        : parseFloat(capeAmount);
    // console.log(capeAmountOther);
    // console.log(capeAmount);
    // console.log(`donationAmount: ${donationAmount}`);

    if (!donationAmount || typeof donationAmount !== "number") {
      console.log("no donation amount chosen");
      const newState = { ...this.state };
      newState.displayCAPEPaymentFields = true;

      return this.setState(newState, () => {
        console.log(this.state.displayCAPEPaymentFields);
      });
    }

    // generate body
    const body = {
      submission_date: utils.formatDate(new Date()),
      contact_id: this.props.submission.salesforceId,
      first_name: formValues.firstName,
      last_name: formValues.lastName,
      home_email: formValues.homeEmail,
      cell_phone: formValues.mobilePhone,
      home_street: formValues.homeStreet,
      home_city: formValues.homeCity,
      home_state: formValues.homeState,
      home_zip: formValues.homeZip,
      job_title: formValues.jobTitle,
      employer_id: employerId,
      payment_method: paymentMethod,
      online_campaign_source: campaignSource,
      cape_legal: this.props.cape_legal.current.innerHTML,
      cape_amount: donationAmount,
      cape_status: "Incomplete",
      donation_frequency: formValues.donationFrequency || "Monthly"
      // member_short_id: this.props.submission.payment.memberShortId
    };
    // console.log(body);
    return body;
  }

  // create an initial CAPE record in postgres to get returned ID
  // not finalized until payment method added and SFCAPE status updated
  async createCAPE(capeAmount, capeAmountOther) {
    // console.log("createCAPE");
    const body = await this.generateCAPEBody(capeAmount, capeAmountOther);
    // console.log(body);
    if (body) {
      const capeResult = await this.props.apiSubmission
        .createCAPE(body)
        .catch(err => {
          console.error(err);
          return handleError(err);
        });

      if (
        (capeResult && capeResult.type !== "CREATE_CAPE_SUCCESS") ||
        this.props.submission.error
      ) {
        console.log(this.props.submission.error);
        return handleError(this.props.submission.error);
      }
    } else {
      console.log("no CAPE body generated");
    }
  }

  async handleCAPESubmit(standAlone) {
    // console.log("handleCAPESubmit");
    const { formValues } = this.props;

    if (standAlone) {
      // verify recaptcha score
      await this.verifyRecaptchaScore()
        .then(score => {
          // console.log(`score: ${score}`);
          if (!score || score <= 0.5) {
            // console.log(`recaptcha failed: ${score}`);
            return handleError(
              "Sorry, your session timed out, please reload the page and try again."
            );
          }
        })
        .catch(err => {
          console.error(err);
        });
    }
    if (
      ((this.props.submission.formPage1.paymentRequired &&
        this.props.submission.formPage1.newCardNeeded) ||
        formValues.donationFrequency === "One-Time") &&
      !this.props.submission.formPage1.paymentMethodAdded
    ) {
      // console.log("No payment method added");
      return handleError("Please click 'Add a Card' to add a payment method");
    }
    // if user clicks submit before the payment logic finishes loading,
    // they may not have donation amount fields visible
    // but will still get an error that the field is missing
    if (!formValues.capeAmount && !formValues.capeAmountOther) {
      // console.log("no donation amount chosen");
      const newState = { ...this.state };
      newState.displayCAPEPaymentFields = true;
      return this.setState(newState, () => {
        // console.log(this.state.displayCAPEPaymentFields);
      });
    }

    let cape_errors = "",
      cape_status = "Pending";
    const body = await this.generateCAPEBody(
      formValues.capeAmount,
      formValues.capeAmountOther
    );
    delete body.cape_status;
    body.member_short_id =
      this.props.submission.payment.memberShortId ||
      this.props.submission.cape.memberShortId;
    // write CAPE contribution to SF
    const sfCapeResult = await this.props.apiSF
      .createSFCAPE(body)
      .catch(err => {
        cape_errors += err;
        cape_status = "Error";
        console.error(err);
        handleError(err);
      });

    let sf_cape_id;

    if (
      (sfCapeResult && sfCapeResult.type !== "CREATE_SF_CAPE_SUCCESS") ||
      this.props.submission.error
    ) {
      cape_errors += this.props.submission.error;
      cape_status = "Error";
      // console.log(this.props.submission.error);
      return handleError(this.props.submission.error);
    } else if (sfCapeResult && sfCapeResult.type === "CREATE_SF_CAPE_SUCCESS") {
      cape_status = "Success";
      sf_cape_id = sfCapeResult.payload.sf_cape_id;
    } else {
      cape_status = "Error";
    }

    const member_short_id =
      this.props.submission.payment.memberShortId ||
      this.props.submission.cape.memberShortId;
    // console.log(`member_short_id: ${member_short_id}`);

    // if initial cape was not already created
    // in the process of generating the iframe url,
    // (checkoff use case), create it now
    if (!this.props.submission.cape.id) {
      await this.createCAPE(
        formValues.capeAmount,
        formValues.capeAmountOther
      ).catch(err => {
        console.error(err);
        return handleError(err);
      });
    }

    // if one-time payment, send API request to unioni.se to process it
    if (formValues.donationFrequency === "One-Time") {
      await this.postOneTimePayment().catch(err => {
        console.error(err);
        return handleError(err);
      });
    }

    // collect updates to cape record (values returned from other API calls,
    // amount and frequency if not captured in initial iframe request)
    const { id, oneTimePaymentId } = this.props.submission.cape;
    const donationAmount =
      formValues.capeAmount === "Other"
        ? parseFloat(formValues.capeAmountOther)
        : parseFloat(formValues.capeAmount);
    const updates = {
      cape_status,
      cape_errors,
      member_short_id,
      one_time_payment_id: oneTimePaymentId,
      cape_amount: donationAmount,
      donation_frequency: formValues.donationFrequency,
      active_method_last_four: this.props.submission.cape.activeMethodLast4,
      card_brand: this.props.submission.cape.cardBrand
    };

    // update CAPE record in postgres
    await this.props.apiSubmission.updateCAPE(id, updates).catch(err => {
      console.error(err);
      // return handleError(err); // don't return to client here
    });
    // console.log(capeResult);

    // if this was a unionise CAPE payment
    // then update the activeMethodLast4, card brand, and
    // payment id (if one-time payment) in SF
    if (
      oneTimePaymentId ||
      !!this.props.submission.cape.activeMethodLast4 ||
      !!this.props.submission.cape.cardBrand
    ) {
      // generate body for this call
      const sfCapeBody = {
        Id: sf_cape_id,
        One_Time_Payment_Id__c: oneTimePaymentId,
        Active_Account_Last_4__c: this.props.submission.cape.activeMethodLast4,
        Card_Brand__c: this.props.submission.cape.cardBrand
      };

      // console.log(sfCapeBody);

      const result = await this.props.apiSF
        .updateSFCAPE(sfCapeBody)
        .catch(err => {
          console.error(err);
          return handleError(err);
        });

      if (
        !result ||
        result.type !== "UPDATE_SF_CAPE_SUCCESS" ||
        this.props.submission.error
      ) {
        // console.log(this.props.submission.error);
        return handleError(this.props.submission.error);
      }
    }

    if (!standAlone) {
      this.props.history.push(
        `/page2/?cId=${this.props.submission.salesforceId}&sId=${
          this.props.submission.submissionId
        }`
      );
    } else {
      openSnackbar("success", "Thank you. Your CAPE submission was processed.");

      this.props.history.push(`/thankyou/?cape=true`);
    }
  }

  async handleTab2() {
    const { formValues } = this.props;
    // submit validation: signature
    const signature = await this.saveSignature().catch(err => {
      // console.log(err);
      return handleError(err);
    });
    if (!signature) {
      return openSnackbar("error", "Please provide a signature");
    }
    // for AFH, calculate dues rate:
    if (formValues.employerType.toLowerCase() === "adult foster home") {
      this.calculateAFHDuesRate(formValues.medicaidResidents);
    }

    // save legal language
    this.saveLegalLanguage();

    // save partial submission (need to do this before generating iframe URL)
    await this.createSubmission().catch(err => {
      console.error(err);
      return handleError(err);
    });

    // if payment required, check if existing payment method on file
    if (this.props.submission.formPage1.paymentRequired) {
      await this.getSFDJRById(this.props.submission.salesforceId)
        .then(result => {
          // console.log(result.type);
          // console.log("SFDJR record: existing");
          // console.log(result.payload);

          const validMethod =
            !!result.payload.Active_Account_Last_4__c &&
            !result.payload.Payment_Error_Hold__c;

          if (validMethod) {
            // console.log("newCardNeeded");
            this.props.apiSubmission.handleInput({
              target: { name: "newCardNeeded", value: false }
            });
          }

          // if payment required (and no existing payment method)
          // preload iframe url for next tab
          if (this.props.submission.formPage1.paymentRequired && !validMethod) {
            this.getIframeURL().catch(err => {
              console.error(err);
              return handleError(err);
            });
          }
        })
        .catch(err => {
          console.error(err);
          return handleError(err);
        });
    }

    // move to next tab
    return this.changeTab(2);
  }

  async handleTab1() {
    const { formValues } = this.props;
    // verify recaptcha score
    const score = await this.verifyRecaptchaScore();
    if (!score || score <= 0.5) {
      // console.log(`recaptcha failed: ${score}`);
      return handleError(
        "ReCaptcha validation failed, please reload the page and try again."
      );
    }
    // handle moving from tab 1 to tab 2:

    // check if payment is required and store this in redux store for later
    if (utils.isPaymentRequired(formValues.employerType)) {
      await this.props.apiSubmission.handleInput({
        target: { name: "paymentRequired", value: true }
      });
      const newState = { ...this.state };
      newState.howManyTabs = 4;
      this.setState(newState);
    } else {
      const newState = { ...this.state };
      newState.howManyTabs = 3;
      this.setState(newState);
    }

    // check if SF contact id already exists (prefill case)
    if (this.props.submission.salesforceId) {
      // update existing contact, move to next tab
      await this.updateSFContact().catch(err => {
        console.error(err);
        return handleError(err);
      });
      return this.changeTab(1);
    }

    // otherwise, lookup contact by first/last/email
    await this.lookupSFContact().catch(err => {
      console.error(err);
      return handleError(err);
    });

    // if lookup was successful, update existing contact and move to next tab
    if (this.props.submission.salesforceId) {
      await this.updateSFContact().catch(err => {
        console.error(err);
        return handleError(err);
      });
      return this.changeTab(1);
    }

    // otherwise, create new contact with submission data,
    // then move to next tab
    await this.createSFContact().catch(err => {
      console.error(err);
      return handleError(err);
    });
    return this.changeTab(1);
  }

  handleTab(newValue) {
    if (newValue === 1) {
      return this.handleTab1().catch(err => {
        console.error(err);
        return handleError(err);
      });
    }
    if (newValue === 2) {
      return this.handleTab2().catch(err => {
        console.error(err);
        return handleError(err);
      });
    } else {
      return this.changeTab(newValue);
    }
  }

  // just navigate to tab, don't run validation on current tab
  changeTab = newValue => {
    const newState = { ...this.state };
    newState.tab = newValue;

    if (newValue === 2) {
      const { formPage1 } = this.props.submission;

      if (
        formPage1.paymentType === "Card" &&
        formPage1.newCardNeeded &&
        formPage1.paymentRequired
      ) {
        // need to set spinner on transition to payment tab
        // while iframe loads
        // this.props.actions.setSpinner();
        return this.setState({ ...newState }, () => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    }
    this.setState({ ...newState }, () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

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
          handleCloseAndClear={this.handleCloseAndClear}
          handleClose={this.handleClose}
          fullName={fullName}
          history={this.props.history}
        />
        <SubmissionFormPage1Wrap
          {...this.props}
          change={change}
          tab={this.state.tab}
          howManyTabs={this.state.howManyTabs}
          handleTab={this.handleTab}
          back={this.changeTab}
          handleUpload={this.handleUpload}
          signatureType={this.state.signatureType}
          toggleSignatureInputType={this.toggleSignatureInputType}
          clearSignature={this.clearSignature}
          generateSubmissionBody={this.generateSubmissionBody}
          handleError={handleError}
          toggleCardAddingFrame={this.toggleCardAddingFrame}
          handleCAPESubmit={this.handleCAPESubmit}
          suggestedAmountOnChange={this.suggestedAmountOnChange}
          verifyRecaptchaScore={this.verifyRecaptchaScore}
          saveSubmissionErrors={this.saveSubmissionErrors}
          handleEmployerTypeChange={this.handleEmployerTypeChange}
          handleEmployerChange={this.handleEmployerChange}
          lookupSFContact={this.lookupSFContact}
          handleDonationFrequencyChange={this.handleDonationFrequencyChange}
          checkCAPEPaymentLogic={this.checkCAPEPaymentLogic}
          displayCAPEPaymentFields={this.state.displayCAPEPaymentFields}
          handleCAPEOpen={this.handleCAPEOpen}
          handleCAPEClose={this.handleCAPEClose}
          capeOpen={this.state.capeOpen}
          closeDialog={this.closeDialog}
          mobilePhoneOnBlur={this.mobilePhoneOnBlur}
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
  actions: bindActionCreators(actions, dispatch),
  submitForm: () => dispatch(submit("submissionPage1"))
});

export const SubmissionFormPage1Connected = connect(
  mapStateToProps,
  mapDispatchToProps
)(SubmissionFormPage1Container);

export default withStyles(stylesPage1)(SubmissionFormPage1Connected);
