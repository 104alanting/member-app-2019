import React from "react";
import { Field } from "redux-form";
import localIpUrl from "local-ip-url";
import PropTypes from "prop-types";
import queryString from "query-string";
import { reduxForm } from "redux-form";
import ReCAPTCHA from "react-google-recaptcha";
import SignatureCanvas from "react-signature-canvas";

import FormLabel from "@material-ui/core/FormLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormGroup from "@material-ui/core/FormGroup";
import FormControl from "@material-ui/core/FormControl";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";

import * as formElements from "./SubmissionFormElements";
import { openSnackbar } from "../containers/Notifier";
import ButtonWithSpinner from "./ButtonWithSpinner";
import WelcomeInfo from "./WelcomeInfo";
import validate from "../utils/validators";

// helper functions these MAY NEED TO BE UPDATED with localization package
const {
  stateList,
  monthList,
  languageOptions,
  dateOptions,
  yearOptions,
  employerTypeMap,
  getKeyByValue,
  formatSFDate
} = formElements;

export class SubmissionFormPage1Component extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    // API call to SF to populate employers picklist
    this.props.apiSF
      .getSFEmployers()
      .then(result => {
        // console.log(result.type);
        // console.log(result.payload)
        this.loadEmployersPicklist();
      })
      .catch(err => {
        // console.log(err);
        openSnackbar(
          "error",
          this.props.submission.error ||
            "An error occurred while trying to fetch data from salesforce."
        );
      });
  }

  componentDidUpdate(prevProps) {
    if (this.props.submission.employerNames.length < 2) {
      this.loadEmployersPicklist();
    }
  }

  // reusable MUI form components
  renderTextField = formElements.renderTextField;
  renderSelect = formElements.renderSelect;
  renderCheckbox = formElements.renderCheckbox;

  loadEmployersPicklist = () => {
    // generate initial picklist of employer types by manipulating data
    // from redux store to replace with more user-friendly names
    const employerTypesListRaw = this.props.submission.employerObjects
      ? this.props.submission.employerObjects.map(
          employer => employer.Sub_Division__c
        )
      : [""];
    const employerTypesCodes = [...new Set(employerTypesListRaw)] || [""];
    const employerTypesList = employerTypesCodes.map(code =>
      employerTypeMap[code] ? employerTypeMap[code] : ""
    ) || [""];
    employerTypesList.unshift("");
    return employerTypesList;
  };

  updateEmployersPicklist = e => {
    let employerObjects = this.props.submission.employerObjects || [
      { Name: "", Sub_Division__c: "" }
    ];

    // get the value of the employer type selected by user
    let employerTypeUserSelect = "";
    if (Object.keys(this.props.formValues).length) {
      employerTypeUserSelect = this.props.formValues.employerType;
    } else {
      // console.log("no formValues in props");
    }

    const employerTypesList = this.loadEmployersPicklist();
    // if picklist finished populating and user has selected employer type,
    // filter the employer names list to return only names in that category
    if (employerTypesList.length > 1 && employerTypeUserSelect !== "") {
      const employerObjectsFiltered = employerTypeUserSelect
        ? employerObjects.filter(
            employer =>
              employer.Sub_Division__c ===
              getKeyByValue(employerTypeMap, employerTypeUserSelect)
          )
        : [{ Name: "" }];
      const employerList = employerObjectsFiltered.map(
        employer => employer.Name
      );
      employerList.unshift("");
      // console.log(employerList);
      return employerList;
    }
  };

  reCaptchaChange = response => {
    // console.log(response, "<= dis your captcha token");
  };

  clearSignature = () => {
    this.sigBox.clear();
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
    let dataURL = this.sigBox.getTrimmedCanvas().toDataURL("image/jpeg");
    console.log("dataURL", dataURL);
    let blobData = this.dataURItoBlob(dataURL);
    console.log("blobData", blobData);
    return blobData;
  };

  handleUpload = (firstName, lastName) => {
    let file = this.trimSignature();
    console.log("file", file);
    let filename = `${firstName}_${lastName}_signature_${new Date()}`;
    console.log(filename);
    console.log(file);
    // const filename = file ? file.name.split(".")[0] : "";
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
        } else {
          return result;
        }
      })
      .catch(err => openSnackbar("error", err));
  };

  handleSubmit = async values => {
    const reCaptchaValue = this.props.reCaptchaRef.current.getValue();
    let signature;
    let {
      firstName,
      lastName,
      dd,
      mm,
      yyyy,
      preferredLanguage,
      homeStreet,
      homeZip,
      homeState,
      homeCity,
      homeEmail,
      mobilePhone,
      employerName,
      textAuthOptOut,
      termsAgree,
      salesforceId
    } = values;
    if (this.props.formValues.signatureType === "write") {
      signature = values.signature;
    }
    if (this.props.formValues.signatureType === "draw") {
      signature = await this.handleUpload(firstName, lastName);
    }
    console.log("signature", signature);
    const dobRaw = mm + "/" + dd + "/" + yyyy;
    const birthdate = formatSFDate(dobRaw);
    const employerObject = this.props.submission.employerObjects
      ? this.props.submission.employerObjects.filter(
          obj => obj.Name.toLowerCase() === employerName.toLowerCase()
        )[0]
      : { Name: "" };
    const employerId = employerObject.Id;
    const agencyNumber = employerObject.Agency_Number__c;
    const legalLanguage = this.props.legal_language.current.textContent;

    const q = queryString.parse(this.props.location.search);
    const campaignSource = q && q.s ? q.s : "Direct seiu503signup";

    if (!salesforceId && q && q.id) {
      salesforceId = q.id;
    }
    if (!reCaptchaValue) {
      openSnackbar("error", "Please verify you are human with Captcha");
      return;
    }
    const body = {
      ip_address: localIpUrl(),
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
      direct_pay_auth: null,
      direct_deposit_auth: null,
      immediate_past_member_status: null,
      salesforce_id: salesforceId,
      reCaptchaValue
    };
    return this.props.apiSubmission
      .addSubmission(body)
      .then(result => {
        // console.log(result.type);
        if (
          result.type === "ADD_SUBMISSION_FAILURE" ||
          this.props.submission.error
        ) {
          openSnackbar(
            "error",
            this.props.submission.error ||
              "An error occurred while trying to submit your information."
          );
        } else {
          this.props.reset("submissionPage1");
          this.props.history.push(`/page2`);
        }
      })
      .catch(err => {
        // console.log(err);
        openSnackbar("error", err);
      });
  };
  render() {
    const { classes } = this.props;
    const employerTypesList = this.loadEmployersPicklist() || [
      { Name: "", Sub_Division__c: "" }
    ];
    const employerList = this.updateEmployersPicklist() || [""];
    return (
      <div className={classes.root} data-test="component-submissionformpage1">
        <WelcomeInfo location={this.props.location} />
        <form
          onSubmit={this.props.handleSubmit(this.handleSubmit.bind(this))}
          id="submissionFormPage1"
          className={classes.form}
        >
          <Field
            label="Employer Type"
            name="employerType"
            id="employerType"
            data-test="employer-type-test"
            type="select"
            classes={classes}
            component={this.renderSelect}
            options={employerTypesList}
            onChange={e => this.updateEmployersPicklist(e)}
            labelWidth={100}
          />
          {this.props.formValues.employerType !== "" && (
            <Field
              labelWidth={104}
              label="Employer Name"
              name="employerName"
              id="employerName"
              type="select"
              classes={classes}
              component={this.renderSelect}
              options={employerList}
            />
          )}
          <Field
            label="First Name"
            name="firstName"
            id="firstName"
            type="text"
            classes={classes}
            component={this.renderTextField}
          />

          <Field
            name="lastName"
            id="lastName"
            label="Last Name"
            classes={classes}
            component={this.renderTextField}
            type="text"
          />

          <FormLabel className={classes.formLabel} component="legend">
            Birthdate
          </FormLabel>
          <FormGroup className={classes.formGroup}>
            <Field
              label="Month"
              name="mm"
              id="mm"
              type="select"
              classes={classes}
              formControlName="formControlDate"
              component={this.renderSelect}
              labelWidth={41}
              options={monthList}
            />

            <Field
              label="Day"
              name="dd"
              id="dd"
              type="select"
              formControlName="formControlDate"
              classes={classes}
              component={this.renderSelect}
              labelWidth={24}
              options={dateOptions(this.props)}
            />

            <Field
              label="Year"
              name="yyyy"
              id="yyyy"
              type="select"
              formControlName="formControlDate"
              classes={classes}
              component={this.renderSelect}
              labelWidth={30}
              options={yearOptions()}
            />
          </FormGroup>

          <Field
            label="Preferred Language"
            name="preferredLanguage"
            id="preferredLanguage"
            type="select"
            classes={classes}
            component={this.renderSelect}
            labelWidth={132}
            options={languageOptions}
          />

          <FormLabel className={classes.formLabel} component="legend">
            Address
          </FormLabel>

          <Field
            label="Home Street"
            name="homeStreet"
            id="homeStreet"
            type="text"
            classes={classes}
            component={this.renderTextField}
          />

          <FormHelperText className={classes.formHelperText}>
            Please enter your physical street address here, not a P.O. box.
            There is a space for a mailing address on the next page, if
            different from your physical address.
          </FormHelperText>

          <Field
            label="Home City"
            name="homeCity"
            id="homeCity"
            type="text"
            classes={classes}
            component={this.renderTextField}
          />

          <Field
            label="Home State"
            name="homeState"
            id="homeState"
            type="select"
            classes={classes}
            component={this.renderSelect}
            options={stateList}
            labelWidth={80}
          />

          <Field
            label="Home Zip"
            name="homeZip"
            id="homeZip"
            type="text"
            classes={classes}
            component={this.renderTextField}
          />

          <Field
            label="Home Email"
            name="homeEmail"
            id="homeEmail"
            type="email"
            classes={classes}
            component={this.renderTextField}
          />

          <FormHelperText className={classes.formHelperText}>
            Please use your personal email if you have one, since some employers
            limit union communication via work email. If you don't have a
            personal email, work email is fine. If you don't have an email
            address, call us at 1.844.503.7348 to sign up over the phone.
          </FormHelperText>
          <FormGroup>
            <Field
              label="Mobile Phone†"
              name="mobilePhone"
              id="mobilePhone"
              type="tel"
              classes={classes}
              component={this.renderTextField}
            />

            <FormHelperText className={classes.formHelperText}>
              † By providing my phone number, I understand that the Service
              Employees International Union (SEIU), its local unions, and
              affiliates may use automated calling technologies and/or text
              message me on my cellular phone on a periodic basis. SEIU will
              never charge for text message alerts. Carrier message and data
              rates may apply to such alerts. Reply STOP to stop receiving
              messages; reply HELP for more information.
            </FormHelperText>

            <Field
              label="Opt Out Of Receiving Mobile Alerts"
              name="textAuthOptOut"
              id="textAuthOptOut"
              type="checkbox"
              formControlName="controlCheckbox"
              classes={classes}
              component={this.renderCheckbox}
            />
          </FormGroup>

          <Field
            formControlName="controlCheckbox"
            label="Agree to Terms of Membership"
            name="termsAgree"
            id="termsAgree"
            type="checkbox"
            classes={classes}
            component={this.renderCheckbox}
          />
          <FormHelperText
            className={classes.formHelperTextLegal}
            id="termsOfServiceLegalLanguage"
            ref={this.props.legal_language}
          >
            Your full name, the network address you are accessing this page
            from, and the timestamp of submission will serve as signature
            indicating: I hereby designate SEIU Local 503, OPEU (or any
            successor Union entity) as my desired collective bargaining agent. I
            also hereby authorize my employer to deduct from my wages,
            commencing with the next payroll period, all Union dues and other
            fees or assessments as shall be certified by SEIU Local 503, OPEU
            (or any successor Union entity) and to remit those amounts to such
            Union. This authorization/delegation is unconditional, made in
            consideration for the cost of representation and other actions in my
            behalf by the Union and is made irrespective of my membership in the
            Union. This authorization is irrevocable for a period of one year
            from the date of execution and from year to year thereafter unless
            not less than thirty (30) and not more than forty-five (45) days
            prior to the end of any annual period or the termination of the
            contract between my employer and the Union, whichever occurs first,
            I notify the Union and my employer in writing, with my valid
            signature, of my desire to revoke this authorization.
          </FormHelperText>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend" className={classes.radioLabel}>
              Signature Type
            </FormLabel>
            <RadioGroup
              aria-label="Signature Type"
              name="signatureType"
              className={classes.groupLeft}
              value={this.props.submission.formPage1.signatureType}
              onChange={this.props.apiSubmission.handleInput}
            >
              <FormControlLabel
                value="write"
                control={<Radio />}
                label="Write"
              />
              <FormControlLabel value="draw" control={<Radio />} label="Draw" />
            </RadioGroup>
          </FormControl>
          {this.props.submission.formPage1.signatureType === "write" && (
            <Field
              label="Signature"
              name="signature"
              id="signature"
              type="text"
              classes={classes}
              component={this.renderTextField}
            />
          )}
          {this.props.submission.formPage1.signatureType === "write" && (
            <FormHelperText className={classes.formHelperText}>
              Enter your full legal name. This will act as your signature.
            </FormHelperText>
          )}
          {this.props.submission.formPage1.signatureType === "draw" && (
            <div className={classes.sigBox}>
              <SignatureCanvas
                ref={ref => {
                  this.sigBox = ref;
                }}
                penColor="black"
                canvasProps={{
                  width: 594,
                  height: 100,
                  className: "sigCanvas",
                  backgroundColor: "rgba(0, 0, 0, 0)"
                }}
                label="Signature"
                name="signature"
                id="signature"
                onChange={this.props.apiSubmission.handleInput}
              />
              <ButtonWithSpinner
                type="button"
                onClick={this.clearSignature}
                color="secondary"
                className={classes.clearButton}
                variant="contained"
              >
                Clear Signature
              </ButtonWithSpinner>
            </div>
          )}
          {this.props.submission.formPage1.signatureType === "draw" && (
            <FormHelperText className={classes.formHelperText}>
              Draw your signature in the box above.
            </FormHelperText>
          )}
          <ReCAPTCHA
            ref={this.props.reCaptchaRef}
            sitekey="6Ld89LEUAAAAAI3_S2GBHXTJGaW-sr8iAeQq0lPY"
            // seiu503signup.org 2019 new form
            // ^^^^^this is the real sitekey, using temporary one to test with localhost
            // sitekey="6LdV6rEUAAAAAOa5zY1Hcl2XHvTb94JmGSa1p33F"
            onChange={this.reCaptchaChange.bind(this)}
          />

          <ButtonWithSpinner
            type="submit"
            color="secondary"
            className={classes.formButton}
            variant="contained"
            loading={this.props.submission.loading}
          >
            Submit
          </ButtonWithSpinner>
        </form>
      </div>
    );
  }
}

SubmissionFormPage1Component.propTypes = {
  type: PropTypes.string,
  appState: PropTypes.shape({
    authToken: PropTypes.string
  }),
  submission: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.string,
    salesforceId: PropTypes.string
  }).isRequired,
  classes: PropTypes.object
};

// add reduxForm to component
export const SubmissionFormWrap = reduxForm({
  form: "submissionPage1",
  validate,
  enableReinitialize: true
})(SubmissionFormPage1Component);

export default SubmissionFormWrap;
