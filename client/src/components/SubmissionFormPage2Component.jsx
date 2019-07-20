import React from "react";
import { Field } from "redux-form";
import PropTypes from "prop-types";

import FormLabel from "@material-ui/core/FormLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormGroup from "@material-ui/core/FormGroup";

import * as formElements from "./SubmissionFormElements";
import { openSnackbar } from "../containers/Notifier";
import ButtonWithSpinner from "./ButtonWithSpinner";

// helper functions these MAY NEED TO BE UPDATED with localization package
const stateList = formElements.stateList;
const genderOptions = formElements.genderOptions;
const genderPronounOptions = formElements.genderPronounOptions;

class SubmissionFormPage2Component extends React.Component {
  classes = this.props.classes;
  constructor(props) {
    super(props);
    this.state = {};
  }

  // reusable MUI form components
  renderTextField = formElements.renderTextField;
  renderSelect = formElements.renderSelect;
  renderCheckbox = formElements.renderCheckbox;

  handleSubmit = values => {
    const {
      mailToCity,
      mailToState,
      mailToStreet,
      mailToZip,
      africanOrAfricanAmerican,
      arabAmericanMiddleEasternOrNorthAfrican,
      asianOrAsianAmerican,
      hispanicOrLatinx,
      nativeAmericanOrIndigenous,
      nativeHawaiianOrOtherPacificIslander,
      white,
      other,
      declined,
      lgbtqId,
      transId,
      disabilityId,
      deafOrHardOfHearing,
      blindOrVisuallyImpaired,
      gender,
      genderOtherDescription,
      genderPronoun,
      jobTitle,
      worksite,
      workEmail,
      workPhone,
      hireDate
    } = values;
    const ethnicity = () => {
      if (declined) {
        return "declined";
      }
      let combinedEthnicities = "";
      const ethnicities = {
        africanOrAfricanAmerican,
        arabAmericanMiddleEasternOrNorthAfrican,
        asianOrAsianAmerican,
        hispanicOrLatinx,
        nativeAmericanOrIndigenous,
        nativeHawaiianOrOtherPacificIslander,
        white,
        other
      };
      const ethnicitiesArray = Object.entries(ethnicities);
      ethnicitiesArray.forEach(i => {
        if (i[1]) {
          if (combinedEthnicities === "") {
            combinedEthnicities = i[0];
          }
          combinedEthnicities += `, ${i[0]}`;
        }
      });
      return combinedEthnicities;
    };

    const body = {
      mail_to_city: mailToCity,
      mail_to_state: mailToState,
      mail_to_street: mailToStreet,
      mail_to_postal_code: mailToZip,
      ethnicity: ethnicity(),
      lgbtq_id: lgbtqId,
      trans_id: transId,
      disability_id: disabilityId,
      deaf_or_hard_of_hearing: deafOrHardOfHearing,
      blind_or_visually_impaired: blindOrVisuallyImpaired,
      gender: gender,
      gender_other_description: genderOtherDescription,
      gender_pronoun: genderPronoun,
      job_title: jobTitle,
      hire_date: hireDate,
      worksite: worksite,
      work_email: workEmail,
      work_phone: workPhone
    };

    const removeFalsy = obj => {
      let newObj = {};
      Object.keys(obj).forEach(prop => {
        if (obj[prop]) {
          newObj[prop] = obj[prop];
        }
      });
      return newObj;
    };

    const cleanBody = removeFalsy(body);

    let id = this.props.submission.salesforceId;

    //HARDCODED ID FOR TESTING, DELETE ME LATER!!!!
    id = "bc9e88b7-342c-4cac-8f7c-5acc96c6401e";
    return this.props.apiSubmission
      .updateSubmission(id, cleanBody)
      .then(result => {
        if (
          result.type === "UPDATE_SUBMISSION_FAILURE" ||
          this.props.submission.error
        ) {
          openSnackbar(
            "error",
            this.props.submission.error ||
              "An error occurred while trying to update your information."
          );
        } else {
          openSnackbar("success", "Your information was updated!");
          this.props.reset("submissionsubmissionPage2");
          this.props.history.push(`/thankyou`);
        }
      })
      .catch(err => openSnackbar("error", err));
  };
  render() {
    return (
      <div
        className={this.classes.root}
        data-test="component-submissionformpage2"
      >
        <form
          id="submissionFormPage2"
          onSubmit={this.props.handleSubmit(this.handleSubmit.bind(this))}
          className={this.classes.form}
        >
          <FormHelperText
            className={this.classes.formHelperText}
            id="page2IntroText"
          >
            Your membership application has been received and will be reviewed
            shortly. In the mean time, please help your fellow union members get
            to know you better by telling us a little more about yourself. SEIU
            Local 503 is committed to honoring the diversity of all members.
            This optional demographic information helps us understand the social
            identities of our membership.
          </FormHelperText>
          <FormLabel className={this.classes.formLabel} component="legend">
            Check as many as apply to your race/ethnicity
          </FormLabel>
          <FormGroup className={this.classes.formGroup}>
            <Field
              label="African or African-American"
              name="africanOrAfricanAmerican"
              id="africanOrAfricanAmerican"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="Arab American, Middle Eastern, or North African"
              name="arabAmericanMiddleEasternOrNorthAfrican"
              id="arabAmericanMiddleEasternOrNorthAfrican"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="Asian or Asian American"
              name="asianOrAsianAmerican"
              id="asianOrAsianAmerican"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="Hispanic or Latinx"
              name="hispanicOrLatinx"
              id="hispanicOrLatinx"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="Native American or Indigenous"
              name="nativeAmericanOrIndigenous"
              id="nativeAmericanOrIndigenous"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="Native Hawaiian or Other Pacific Islander"
              name="nativeHawaiianOrOtherPacificIslander"
              id="nativeHawaiianOrOtherPacificIslander"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="White"
              name="white"
              id="white"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="Other"
              name="other"
              id="other"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="Declined"
              name="declined"
              id="declined"
              classes={this.classes}
              component={this.renderCheckbox}
            />
          </FormGroup>

          <FormLabel className={this.classes.formLabel} component="legend">
            Other Social Identities
          </FormLabel>
          <FormGroup className={this.classes.formGroup}>
            <Field
              label="I identify as LGBTQIA+"
              name="lgbtqId"
              id="lgbtqId"
              type="checkbox"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="I identify as transgender"
              name="transId"
              id="transId"
              type="checkbox"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="I identify as disabled or a person with a disability"
              name="disabilityId"
              id="disabilityId"
              type="checkbox"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="I identify as Deaf or hard-of-hearing"
              name="deafOrHardOfHearing"
              id="deafOrHardOfHearing"
              type="checkbox"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="I identify as Blind or visually impaired"
              name="blindOrVisuallyImpaired"
              id="blindOrVisuallyImpaired"
              type="checkbox"
              classes={this.classes}
              component={this.renderCheckbox}
            />
            <Field
              label="Gender"
              name="gender"
              id="gender"
              type="select"
              classes={this.classes}
              component={this.renderSelect}
              labelWidth={41}
              options={genderOptions}
            />
            <Field
              label="If other, Please describe"
              name="genderOtherDescription"
              id="genderOtherDescription"
              type="text"
              classes={this.classes}
              component={this.renderTextField}
            />
            <Field
              label="Your pronouns"
              name="genderPronoun"
              id="genderPronoun"
              type="select"
              classes={this.classes}
              component={this.renderSelect}
              labelWidth={41}
              options={genderPronounOptions}
            />
          </FormGroup>

          <FormLabel className={this.classes.formLabel} component="legend">
            Employemnt Info
          </FormLabel>
          <FormGroup className={this.classes.formGroup}>
            <Field
              label="Job Class/Title"
              name="jobTitle"
              id="jobTitle"
              type="text"
              classes={this.classes}
              component={this.renderTextField}
            />
            <Field
              label="Hire Date"
              name="hireDate"
              id="hireDate"
              type="text"
              classes={this.classes}
              component={this.renderTextField}
            />
            <Field
              label="Worksite"
              name="worksite"
              id="worksite"
              type="text"
              classes={this.classes}
              component={this.renderTextField}
            />
            <Field
              label="Work Email"
              name="workEmail"
              id="workEmail"
              type="text"
              classes={this.classes}
              component={this.renderTextField}
            />
            <Field
              label="Work Phone"
              name="workPhone"
              id="workPhone"
              type="text"
              classes={this.classes}
              component={this.renderTextField}
            />
          </FormGroup>

          <FormLabel className={this.classes.formLabel} component="legend">
            Mailing Address
          </FormLabel>
          <FormHelperText
            className={this.classes.formHelperText}
            id="mailingAddressDescription"
          >
            If different from residence address
          </FormHelperText>
          <FormGroup className={this.classes.formGroup}>
            <Field
              label="Mailing Street"
              name="mailToStreet"
              id="mailToStreet"
              type="text"
              classes={this.classes}
              component={this.renderTextField}
            />
            <Field
              label="Mailing City"
              name="mailToCity"
              id="mailToCity"
              type="text"
              classes={this.classes}
              component={this.renderTextField}
            />
            <Field
              label="Mailing State"
              name="mailToState"
              id="mailToState"
              type="select"
              classes={this.classes}
              formControlName="formControlDate"
              component={this.renderSelect}
              labelWidth={41}
              options={stateList}
            />
            <Field
              label="Mailing ZIP"
              name="mailToZip"
              id="mailToZip"
              type="text"
              classes={this.classes}
              component={this.renderTextField}
            />
          </FormGroup>

          <ButtonWithSpinner
            type="submit"
            color="secondary"
            className={this.classes.formButton}
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

SubmissionFormPage2Component.propTypes = {
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

export default SubmissionFormPage2Component;