/*
   Route handlers for fetching and updating submissions.
*/

/* ================================= SETUP ================================= */

// import models
const submissions = require("../../db/models/submissions");
const contacts = require("../../db/models/contacts");

/* ============================ ROUTE HANDLERS ============================= */

/** Create a Submission
 *  @param    {String}   ip_address             IP address
 *  @param    {Timestamp} submission_date       Submission timestamp
 *  @param    {String}   agency_number          Agency number
 *  @param    {String}   birthdate              Birthdate
 *  @param    {String}   cell_phone             Cell phone
 *  @param    {String}   employer_name          Employer name
 *  @param    {String}   first_name             First name
 *  @param    {String}   last_name              Last name
 *  @param    {String}   home_street            Home street
 *  @param    {String}   home_city              Home city
 *  @param    {String}   home_state             Home state
 *  @param    {String}   home_zip               Home zip
 *  @param    {String}   home_email             Home email
 *  @param    {String}   preferred_language     Preferred language
 *  @param    {Boolean}  terms_agree            Agreement to membership terms
 *  @param    {String}   Signature              URL of signature image
 *  @param    {Boolean}  text_auth_opt_out      Text authorization opt out
 *  @param    {String}   online_campaign_source Online campaign source
 *  @param    {String}   contact_id             Contact id
 *  @param    {String}   legal_language         Dynamic dump of html legal language on form at time of submission
 *  @param    {Date}  maintenance_of_effort     Date of submission; confirmation of MOE checkbox
 *  @param    {Date}   seiu503_cba_app_date     Date of submission; confirmation of submitting membership form
 *  @param    {Date}   direct_pay_auth          Date of submission; confirmation of direct pay authorization
 *  @param    {Date}   direct_deposit_auth      Date of submission; confirmation of direct deposit authorization
 *  @param    {String}   immediate_past_member_status   Immediate past member status (populated from SF for existing contact matches)
 *  @returns  {Object}    New Submission Object or error message.
 */
const createSubmission = (req, res, next) => {
  const {
    ip_address,
    submission_date,
    agency_number,
    birthdate,
    cell_phone,
    employer_name,
    first_name,
    last_name,
    home_street,
    home_city,
    home_state,
    home_zip,
    home_email,
    preferred_language,
    terms_agree,
    signature,
    text_auth_opt_out,
    online_campaign_source,
    contact_id,
    legal_language,
    maintenance_of_effort,
    seiu503_cba_app_date,
    direct_pay_auth,
    direct_deposit_auth,
    immediate_past_member_status
  } = req.body;

  const requiredFields = [
    submission_date,
    birthdate,
    cell_phone,
    employer_name,
    first_name,
    last_name,
    home_street,
    home_city,
    home_state,
    home_zip,
    home_email,
    preferred_language,
    terms_agree,
    signature,
    legal_language,
    maintenance_of_effort,
    seiu503_cba_app_date
  ];

  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      reason: "ValidationError",
      message: "Missing required fields"
    });
  }

  if (!missingField) {
    return submissions
      .createSubmission(
        ip_address,
        submission_date,
        agency_number,
        birthdate,
        cell_phone,
        employer_name,
        first_name,
        last_name,
        home_street,
        home_city,
        home_state,
        home_zip,
        home_email,
        preferred_language,
        terms_agree,
        signature,
        text_auth_opt_out,
        online_campaign_source,
        contact_id,
        legal_language,
        maintenance_of_effort,
        seiu503_cba_app_date,
        direct_pay_auth,
        direct_deposit_auth,
        immediate_past_member_status
      )
      .then(submissions => {
        const submission = submissions[0];
        attachContactSubmissions(
          submission.contact_id,
          submission.submission_id
        );
        res.status(200).json(submission);
      })
      .catch(err => {
        console.log(`submissions.ctrl.js > 134: ${err}`);
        res.status(500).json({ message: err.message });
      });
  } else {
    return res
      .status(500)
      .json({ message: "There was an error creating the submission" });
  }
};

/** Attach submission to join table
 *
 * @param {String} id   Id of contact to view submissions
 * @returns {Object}    Object containing contact id and array of all related submissions
 */
const attachContactSubmissions = (contact_id, submission_id) => {
  return contacts
    .attachContactSubmissions(contact_id, submission_id)
    .then(contact_submissions => {
      if (!contact_submissions || contact_submissions.message) {
        return res.status(404).json({
          message:
            contact_submissions.message ||
            "Error adding Submission to contacts_submissions table"
        });
      } else {
        res.status(200).json(contact_submissions);
      }
    })
    .catch(err => res.status(404).json({ message: err.message }));
};

/** Update a Submission
 *  @param    {String}   id             The id of the submission to update.
 *  @param    {Object}   updates        Key/value pairs of fields to update.
 *  @returns  {Object}      Updated Submission object.
 */
const updateSubmission = (req, res, next) => {
  const { updates } = req.body;
  const { id } = req.params;
  if (!updates || !Object.keys(updates).length) {
    return res.status(404).json({ message: "No updates submitted" });
  }

  return submissions
    .updateSubmission(id, updates)
    .then(submission => {
      if (submission.message || !submission) {
        return res.status(404).json({
          message:
            submission.message ||
            "An error occured while trying to update this submission"
        });
      } else {
        return res.status(200).json(submission);
      }
    })
    .catch(err => res.status(500).json({ message: err.message }));
};

/** Delete submission
 *  @param    {String}   id   Id of the submission to delete.
 *  @returns  Success or error message.
 */
const deleteSubmission = (req, res, next) => {
  return submissions
    .deleteSubmission(req.params.id)
    .then(result => {
      if (result.message === "Submission deleted successfully") {
        return res.status(200).json({ message: result.message });
      } else {
        return res.status(404).json({
          message: "An error occurred and the submission was not deleted."
        });
      }
    })
    .catch(err => res.status(404).json({ message: err.message }));
};

/** Get all submissions
 *  @returns  {Array|Object}   Array of submission objects OR error message
 */
const getSubmissions = () => {
  return submissions
    .getSubmissions()
    .then(submissions => res.status(200).json(submissions))
    .catch(err => res.status(404).json({ message: err.message }));
};

/** Get one submission
 *  @param    {String}   id   Id of the requested submission.
 *  @returns  {Object}        Submission object OR error message.
 */
const getSubmissionById = (req, res, next) => {
  return submissions
    .getSubmissoinById(req.params.id)
    .then(submission => {
      if (!submission || submission.message) {
        return res
          .status(404)
          .json({ message: submission.message || "Submission not found" });
      } else {
        res.status(200).json(submission);
      }
    })
    .catch(err => res.status(404).json({ message: err.message }));
};

/* ================================ EXPORT ================================= */

module.exports = {
  createSubmission,
  updateSubmission,
  deleteSubmission,
  getSubmissionById,
  getSubmissions
};