import React from "react";
import { Field, reduxForm, getFormValues } from "redux-form";
import { connect } from "react-redux";
import Iframe from "react-iframe";

import ButtonWithSpinner from "./ButtonWithSpinner";
import Button from "@material-ui/core/Button";
import * as formElements from "./SubmissionFormElements";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";

import headshot from "../img/deffo_mebrat_300.png";

import PropTypes from "prop-types";

import validate from "../utils/validators";
import { scrollToFirstError } from "../utils";

export const CAPE = props => {
  const {
    onSubmit,
    classes,
    loading,
    invalid,
    iFrameURL,
    back,
    checkoff,
    formValues,
    formPage1,
    payment,
    toggleCardAddingFrame,
    standAlone
  } = props;

  const validMethod = !!payment.activeMethodLast4 && !payment.paymentErrorHold;
  const legalCopy = checkoff
    ? formElements.capeLegalCheckoff
    : formElements.capeLegalStripe;

  return (
    <div data-test="component-cape" className={classes.sectionContainer}>
      <form
        onSubmit={props.handleSubmit(onSubmit)}
        id="CAPE"
        className={classes.form}
      >
        <div className={classes.paymentCopy}>
          <Typography component="h2" className={classes.head}>
            CAPE: Citizen Action for Political Education
          </Typography>
          <Typography component="p" className={classes.subhead}>
            Collective political action to raise wages, protect benefits, fund
            public services, and build strong communities.
          </Typography>
          <Typography component="p" className={classes.body}>
            When workers unite, legislators listen. In 2019, SEIU Local 503 CAPE
            advocacy led to historic wins:
          </Typography>
          <ul className={classes.ul}>
            <li className={classes.li}>
              Funding for raises and benefits for state employees and homecare
              workers are double what they were in the last budget, setting
              members up for strong contracts
            </li>
            <li className={classes.li}>
              State Agency budgets increased to provide additional resources
              members need to do their jobs
            </li>
            <li className={classes.li}>
              The Oregon Public Worker Protection Act protects our right to
              belong to a union free from retaliation and harassment
            </li>
            <li className={classes.li}>
              “Double Coverage” health care for families where both spouses work
              in public service
            </li>
            <li className={classes.li}>
              Oregon passed the strongest Paid Family and Medical Leave law in
              the nation
            </li>
            <li className={classes.li}>
              Our state became the first in the U.S. to pass statewide rent
              stabilization and ban no-cause evictions
            </li>
            <li className={classes.li}>
              The Legislature passed a statewide bill that will hold private
              agency homecare and our homecare workers to the same standards
            </li>
          </ul>
          <Card className={classes.card}>
            <div className={classes.details}>
              <CardContent className={classes.content}>
                <Typography
                  component="h5"
                  variant="h5"
                  className={classes.cardHead}
                >
                  Join us
                </Typography>
                <Typography component="p" className={classes.pullQuote}>
                  “I can’t write big checks. But I contribute what I can each
                  month to CAPE. And when we put all of our resources together,
                  we have shown we can elect legislators in Oregon who will
                  fight for working families and our clients.”
                </Typography>
                <Typography component="p" className={classes.quoteAttr}>
                  - Deffo Mebrat, Adult Foster Care Provider
                </Typography>
              </CardContent>
            </div>
            <CardMedia
              className={classes.cover}
              image={headshot}
              title="Deffo Mebrat"
            />
          </Card>
          <Typography />
        </div>
        {formPage1.paymentRequired &&
          formPage1.paymentType === "Card" &&
          validMethod && (
            <div data-test="component-choose-card">
              <Typography component="p" className={classes.body}>
                Your existing payment method on file is the card ending in{" "}
                {payment.activeMethodLast4}.
              </Typography>
              <Field
                data-test="radio-which-card"
                label="Do you want to use the existing card or add a new one?"
                name="whichCard"
                formControlName="whichCard"
                id="whichCard"
                direction="horiz"
                className={classes.horizRadio}
                legendClass={classes.horizRadioBold}
                classes={classes}
                defaultItem="Use existing"
                additionalOnChange={toggleCardAddingFrame}
                component={formElements.renderRadioGroup}
                options={["Use existing", "Add new card"]}
              />
            </div>
          )}
        {iFrameURL && formPage1.newCardNeeded && formPage1.paymentRequired && (
          <div data-test="component-iframe">
            <Typography component="h2" className={classes.head}>
              Add a payment method
            </Typography>
            <div className={classes.iframeWrap}>
              <Iframe
                url={iFrameURL}
                width="100%"
                height="100px"
                id="iFrame"
                className={classes.iframe}
                display="initial"
                position="relative"
              />
            </div>
          </div>
        )}
        {!standAlone && (
          <div className={classes.buttonWrapTab3}>
            <Button
              type="button"
              data-test="button-back"
              onClick={() => back(1)}
              color="primary"
              className={classes.back}
              variant="contained"
            >
              Back
            </Button>
          </div>
        )}
        <div className={classes.legalCopy}>{legalCopy}</div>

        <ButtonWithSpinner
          type="submit"
          color="secondary"
          className={classes.formButton}
          variant="contained"
          loading={loading}
          disabled={invalid}
        >
          Submit
        </ButtonWithSpinner>
      </form>
    </div>
  );
};

CAPE.propTypes = {
  onSubmit: PropTypes.func,
  classes: PropTypes.object,
  reCaptchaChange: PropTypes.func,
  reCaptchaRef: PropTypes.object,
  loading: PropTypes.bool,
  pristine: PropTypes.bool,
  invalid: PropTypes.bool
};

const mapStateToProps = state => ({
  submission: state.submission,
  initialValues: state.submission.formPage1,
  formValues: getFormValues("submissionPage1")(state) || {}
});

// add reduxForm to component
export const CAPEForm = reduxForm({
  form: "submissionPage1",
  validate,
  destroyOnUnmount: false,
  forceUnregisterOnUnmount: true, // <------ unregister fields on unmount
  enableReinitialize: true,
  keepDirtyOnReinitialize: true,
  updateUnregisteredFields: true,
  onSubmitFail: errors => scrollToFirstError(errors)
})(CAPE);

// connect to redux store
export const CAPEConnected = connect(mapStateToProps)(CAPEForm);

export default CAPEConnected;
