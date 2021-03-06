import React from "react";
import { shallow } from "enzyme";
import moment from "moment";
import "jest-canvas-mock";
import * as formElements from "../../../components/SubmissionFormElements";

import { SubmissionFormPage1Container } from "../../../containers/SubmissionFormPage1";

let wrapper, trimSignatureMock;

let pushMock = jest.fn(),
  handleInputMock = jest.fn().mockImplementation(() => Promise.resolve({})),
  clearFormMock = jest.fn().mockImplementation(() => console.log("clearform")),
  executeMock = jest.fn().mockImplementation(() => Promise.resolve());

let updateSFContactSuccess = jest
  .fn()
  .mockImplementation(() =>
    Promise.resolve({ type: "UPDATE_SF_CONTACT_SUCCESS", payload: {} })
  );

let lookupSFContactSuccess = jest.fn().mockImplementation(() =>
  Promise.resolve({
    type: "LOOKUP_SF_CONTACT_SUCCESS",
    payload: { salesforce_id: "123" }
  })
);

let createSFContactSuccess = jest.fn().mockImplementation(() =>
  Promise.resolve({
    type: "CREATE_SF_CONTACT_SUCCESS",
    payload: { salesforce_id: "123" }
  })
);

let getSFContactByIdSuccess = jest.fn().mockImplementation(() =>
  Promise.resolve({
    type: "GET_SF_CONTACT_SUCCESS",
    payload: {
      Birthdate: moment("01-01-1900", "MM-DD-YYYY"),
      firstName: "test",
      lastName: "test"
    }
  })
);

let getSFContactByDoubleIdSuccess = jest.fn().mockImplementation(() =>
  Promise.resolve({
    type: "GET_SF_CONTACT_DID_SUCCESS",
    payload: {
      firstName: "test",
      lastName: "test"
    }
  })
);

let getSFDJRSuccess = jest
  .fn()
  .mockImplementation(() =>
    Promise.resolve({ type: "GET_SF_DJR_SUCCESS", payload: {} })
  );

let createSFDJRSuccess = jest
  .fn()
  .mockImplementation(() =>
    Promise.resolve({ type: "CREATE_SF_DJR_SUCCESS", payload: {} })
  );

let updateSFDJRSuccess = jest
  .fn()
  .mockImplementation(() =>
    Promise.resolve({ type: "UPDATE_SF_DJR_SUCCESS", payload: {} })
  );

let refreshRecaptchaMock = jest
  .fn()
  .mockImplementation(() => Promise.resolve({}));

global.scrollTo = jest.fn();

const clearSigBoxMock = jest.fn();
let toDataURLMock = jest.fn();

const sigBox = {
  current: {
    toDataURL: toDataURLMock,
    clear: clearSigBoxMock
  }
};

const formValues = {
  firstName: "firstName",
  lastName: "lastName",
  homeEmail: "homeEmail",
  homeStreet: "homeStreet",
  homeCity: "homeCity",
  homeZip: "homeZip",
  homeState: "homeState",
  signature: "signature",
  employerType: "employerType",
  employerName: "employerName",
  mobilePhone: "mobilePhone",
  mm: "12",
  dd: "01",
  yyyy: "1999",
  preferredLanguage: "English",
  textAuthOptOut: false
};

const defaultProps = {
  submission: {
    error: null,
    loading: false,
    formPage1: {
      signature: ""
    },
    cape: {},
    payment: {}
  },
  initialValues: {
    mm: "",
    onlineCampaignSource: null
  },
  formValues,
  location: {
    search: "id=1"
  },
  classes: {},
  apiSF: {
    getSFEmployers: () => Promise.resolve({ type: "GET_SF_EMPLOYER_SUCCESS" }),
    getSFContactById: getSFContactByIdSuccess,
    getSFContactByDoubleId: getSFContactByDoubleIdSuccess,
    createSFOMA: () => Promise.resolve({ type: "CREATE_SF_OMA_SUCCESS" }),
    getIframeURL: () =>
      Promise.resolve({ type: "GET_IFRAME_URL_SUCCESS", payload: {} }),
    createSFDJR: createSFDJRSuccess,
    updateSFDJR: updateSFDJRSuccess,
    getSFDJRById: getSFDJRSuccess,
    updateSFContact: updateSFContactSuccess,
    createSFContact: createSFContactSuccess,
    lookupSFContact: lookupSFContactSuccess
  },
  apiSubmission: {
    handleInput: handleInputMock,
    clearForm: clearFormMock,
    setCAPEOptions: jest.fn(),
    addSubmission: () => Promise.resolve({ type: "ADD_SUBMISSION_SUCCESS" })
  },
  history: {
    push: pushMock
  },
  recaptcha: {
    execute: executeMock
  },
  refreshRecaptcha: refreshRecaptchaMock,
  sigBox: { ...sigBox },
  content: {
    error: null
  },
  legal_language: {
    current: {
      innerHTML: "legal"
    }
  },
  direct_deposit: {
    current: {
      innerHTML: "deposit"
    }
  },
  direct_pay: {
    current: {
      innerHTML: "pay"
    }
  },
  actions: {
    setSpinner: jest.fn()
  }
};

const setup = (props = {}) => {
  const setupProps = { ...defaultProps, ...props };
  return shallow(<SubmissionFormPage1Container {...setupProps} />);
};

describe("<SubmissionFormPage1Container /> unconnected", () => {
  beforeEach(() => {
    // console.log = jest.fn();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("handleUpload", () => {
    test("`handleUpload` calls apiContent.uploadImage", () => {
      let uploadImageMock = jest.fn().mockImplementation(() =>
        Promise.resolve({
          type: "UPLOAD_IMAGE_SUCCESS",
          payload: { content: "sigUrl" }
        })
      );
      let props = {
        apiContent: { uploadImage: uploadImageMock }
      };

      wrapper = setup(props);

      let blob = new Blob([""], { type: "image/jpg" });
      blob["lastModifiedDate"] = "";
      blob["name"] = "filename";
      let fakeFile = blob;
      trimSignatureMock = jest.fn().mockImplementation(() => fakeFile);
      wrapper.instance().trimSignature = trimSignatureMock;
      wrapper.instance().handleUpload("firstname", "lastname");
      expect(uploadImageMock.mock.calls.length).toBe(1);
    });

    test("`handleUpload` handles uploadImage error", async function() {
      formElements.handleError = jest.fn();
      let uploadImageMock = jest.fn().mockImplementation(() =>
        Promise.reject({
          type: "UPLOAD_IMAGE_FAILURE"
        })
      );
      let props = {
        apiContent: { uploadImage: uploadImageMock }
      };

      wrapper = setup(props);

      let fakeFile = null;
      trimSignatureMock = jest.fn().mockImplementation(() => fakeFile);
      wrapper.instance().trimSignature = trimSignatureMock;
      await wrapper.instance().handleUpload("firstname", "lastname");
      expect(formElements.handleError.mock.calls.length).toBe(1);
    });

    test("`handleUpload` handles uploadImage failure", async function() {
      formElements.handleError = jest.fn();
      let uploadImageMock = jest.fn().mockImplementation(() =>
        Promise.resolve({
          type: "UPLOAD_IMAGE_FAILURE"
        })
      );
      let props = {
        apiContent: { uploadImage: uploadImageMock }
      };

      wrapper = setup(props);

      let blob = new Blob([""], { type: "image/jpg" });
      blob["lastModifiedDate"] = "";
      blob["name"] = "filename";
      let fakeFile = blob;
      trimSignatureMock = jest.fn().mockImplementation(() => fakeFile);
      wrapper.instance().trimSignature = trimSignatureMock;
      await wrapper.instance().handleUpload("firstname", "lastname");
      expect(formElements.handleError.mock.calls.length).toBe(1);
    });
  });
});
