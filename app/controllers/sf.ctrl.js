const jsforce = require("jsforce");
const {
  contactsTableFields,
  submissionsTableFields,
  generateSFContactFieldList,
  formatDate
} = require("../utils/fieldConfigs");

const conn = new jsforce.Connection({
  loginUrl: "https://test.salesforce.com" // setup for sandbox
});
const user = process.env.SALESFORCE_USER;
const password = process.env.SALESFORCE_PWD;
const fieldList = generateSFContactFieldList();

/** Fetch one contact from Salesforce by Salesforce Contact ID
 *  @param    {String}   id  	Salesforce Contact ID
 *  @returns  {Object}       	Salesforce Contact object OR error message.
 */
const getSFContactById = (req, res, next) => {
  const { id } = req.params;
  const query = `SELECT ${fieldList.join(
    ","
  )} FROM Contact WHERE Id = \'${id}\'`;
  conn.login(user, password, function(err, userInfo) {
    if (err) {
      console.log("sf.ctrl.js > 27");
      console.error(err);
      return res.status(500).json({ message: err.message });
    }

    try {
      conn.query(query, function(err, contact) {
        if (err) {
          console.log("sf.ctrl.js > 35");
          console.error(err);
          return res.status(500).json({ message: err.message });
        }
        res.status(200).json(contact.records[0]);
      });
    } catch (err) {
      console.log("sf.ctrl.js > 42");
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  });
};

/** Get an array of all employers from Salesforce
 *  @param    {none}
 *  @returns  {Array||Object}    Array of SF Account objects OR error message.
 */
const getAllEmployers = (req, res, next) => {
  const query = `SELECT Id, Name, Sub_Division__c, Agency_Number__c FROM Account WHERE RecordTypeId = '01261000000ksTuAAI' and Division__c IN ('Retirees', 'Public', 'Care Provider')`;
  conn.login(user, password, function(err, userInfo) {
    if (err) {
      console.log("sf.ctrl.js > 57");
      console.error(err);
      return res.status(500).json({ message: err.message });
    }

    try {
      conn.query(query, function(err, accounts) {
        if (err) {
          console.log("sf.ctrl.js > 65");
          console.error(err);
          return res.status(500).json({ message: err.message });
        }
        res.status(200).json(accounts.records);
      });
    } catch (err) {
      console.log("sf.ctrl.js > 72");
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  });
};

/** Update a contact in Salesforce by Salesforce Contact ID
 *  @param    {String}   id           Salesforce Contact ID
 *  @param    {Object}   body         Raw submission data used to generate
 *                                    updates object, containing
 *                                    key/value pairs of fields to be updated.
 *  @returns  {Object}        Salesforce Contact id OR error message.
 */
const updateSFContact = (req, res, next) => {
  const { sf_contact_id, submission_id } = res.locals;
  const updatesRaw = { ...req.body };
  const updates = {};
  // convert updates object to key/value pairs using
  // SF API field names
  Object.keys(updatesRaw).forEach(key => {
    if (contactsTableFields[key]) {
      const sfFieldName = contactsTableFields[key].SFAPIName;
      updates[sfFieldName] = updatesRaw[key];
    }
  });
  delete updates["Account.Id"];
  delete updates["Account.Agency_Number__c"];
  updates.AccountId = updatesRaw.employer_id;
  conn.login(user, password, function(err, userInfo) {
    if (err) {
      console.log("sf.ctrl.js > 102");
      console.error(err);
      return res.status(500).json({ message: err.message });
    }

    try {
      conn.sobject("Contact").update(
        {
          Id: sf_contact_id,
          ...updates
        },
        function(err, contact) {
          if (err || !contact.success) {
            console.log("sf.ctrl.js > 115");
            return console.error(err, contact);
          } else {
            return res.status(200).json({
              salesforce_id: sf_contact_id,
              submission_id
            });
          }
        }
      );
    } catch (err) {
      console.log("sf.ctrl.js > 128");
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  });
};

/** Create an OnlineMemberApps object in Salesforce with submission data
 *  @param    {Object}   body         Submission object
 *  @returns  does not return to client; passes salesforce_id to next function
 */

const createSFOnlineMemberApp = (req, res, next) => {
  conn.login(user, password, function(err, userInfo) {
    if (err) {
      console.log("sf.ctrl.js > 143");
      console.error(err);
      return res.status(500).json({ message: err.message });
    }

    try {
      const dataRaw = { ...req.body };
      const data = {};
      // convert data object to key/value pairs using
      // SF API field names
      Object.keys(dataRaw).forEach(key => {
        if (submissionsTableFields[key]) {
          const sfFieldName = submissionsTableFields[key].SFAPIName;
          data[sfFieldName] = dataRaw[key];
        }
      });
      data.Worker__c = res.locals.sf_contact_id;
      data.Birthdate__c = formatDate(dataRaw.birthdate);
      conn.sobject("OnlineMemberApp__c").create(
        {
          ...data
        },
        function(err, OMA) {
          if (err || !OMA.success) {
            console.log("sf.ctrl.js > 167");
            return console.error(err);
          } else {
            return next();
          }
        }
      );
    } catch (err) {
      console.log("sf.ctrl.js > 175");
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  });
};

/* ================================ EXPORT ================================= */

module.exports = {
  getSFContactById,
  getAllEmployers,
  createSFOnlineMemberApp,
  updateSFContact
};