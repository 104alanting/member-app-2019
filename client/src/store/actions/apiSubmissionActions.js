import { RSAA } from "redux-api-middleware";
const BASE_URL = process.env.REACT_APP_BASE_URL;

export const ADD_SUBMISSION_REQUEST = "ADD_SUBMISSION_REQUEST";
export const ADD_SUBMISSION_SUCCESS = "ADD_SUBMISSION_SUCCESS";
export const ADD_SUBMISSION_FAILURE = "ADD_SUBMISSION_FAILURE";
export const CREATE_CAPE_REQUEST = "CREATE_CAPE_REQUEST";
export const CREATE_CAPE_SUCCESS = "CREATE_CAPE_SUCCESS";
export const CREATE_CAPE_FAILURE = "CREATE_CAPE_FAILURE";
export const UPDATE_CAPE_REQUEST = "UPDATE_CAPE_REQUEST";
export const UPDATE_CAPE_SUCCESS = "UPDATE_CAPE_SUCCESS";
export const UPDATE_CAPE_FAILURE = "UPDATE_CAPE_FAILURE";
export const GET_CAPE_BY_SFID_REQUEST = "GET_CAPE_BY_SFID_REQUEST";
export const GET_CAPE_BY_SFID_SUCCESS = "GET_CAPE_BY_SFID_SUCCESS";
export const GET_CAPE_BY_SFID_FAILURE = "GET_CAPE_BY_SFID_FAILURE";
export const SAVE_SALESFORCEID = "SAVE_SALESFORCEID";
export const SAVE_SUBMISSIONID = "SAVE_SUBMISSIONID";
export const UPDATE_SUBMISSION_REQUEST = "UPDATE_SUBMISSION_REQUEST";
export const UPDATE_SUBMISSION_SUCCESS = "UPDATE_SUBMISSION_SUCCESS";
export const UPDATE_SUBMISSION_FAILURE = "UPDATE_SUBMISSION_FAILURE";
export const GET_ALL_SUBMISSIONS_REQUEST = "GET_ALL_SUBMISSIONS_REQUEST";
export const GET_ALL_SUBMISSIONS_SUCCESS = "GET_ALL_SUBMISSIONS_SUCCESS";
export const GET_ALL_SUBMISSIONS_FAILURE = "GET_ALL_SUBMISSIONS_FAILURE";
export const HANDLE_INPUT = "HANDLE_INPUT";
export const CLEAR_FORM = "CLEAR_FORM";
export const SET_CAPE_OPTIONS = "SET_CAPE_OPTIONS";
export const SET_PAYMENT_DETAILS_CAPE = "SET_PAYMENT_DETAILS_CAPE";
export const SET_PAYMENT_DETAILS_DUES = "SET_PAYMENT_DETAILS_DUES";
export const VERIFY_REQUEST = "VERIFY_REQUEST";
export const VERIFY_SUCCESS = "VERIFY_SUCCESS";
export const VERIFY_FAILURE = "VERIFY_FAILURE";
export const LOAD_RECAPTCHA_REQUEST = "LOAD_RECAPTCHA_REQUEST";
export const LOAD_RECAPTCHA_SUCCESS = "LOAD_RECAPTCHA_SUCCESS";
export const LOAD_RECAPTCHA_FAILURE = "LOAD_RECAPTCHA_FAILURE";

export function handleInput({ target: { name, value } }) {
  return {
    type: HANDLE_INPUT,
    payload: { name, value }
  };
}

export function clearForm() {
  return {
    type: CLEAR_FORM
  };
}

export function setCAPEOptions({ monthlyOptions, oneTimeOptions }) {
  return {
    type: SET_CAPE_OPTIONS,
    payload: { monthlyOptions, oneTimeOptions }
  };
}

export function setPaymentDetailsCAPE(paymentAdded, cardBrand, cardLast4) {
  return {
    type: SET_PAYMENT_DETAILS_CAPE,
    payload: { paymentAdded, cardBrand, cardLast4 }
  };
}

export function setPaymentDetailsDues(paymentAdded, cardBrand, cardLast4) {
  return {
    type: SET_PAYMENT_DETAILS_DUES,
    payload: { paymentAdded, cardBrand, cardLast4 }
  };
}

export function addSubmission(body) {
  return {
    [RSAA]: {
      endpoint: `${BASE_URL}/api/submission`,
      method: "POST",
      types: [
        ADD_SUBMISSION_REQUEST,
        ADD_SUBMISSION_SUCCESS,
        {
          type: ADD_SUBMISSION_FAILURE,
          payload: (action, state, res) => {
            return res.json().then(data => {
              let message = "Sorry, something went wrong :(";
              if (data && data.message) {
                message = data.message;
              }
              return { message };
            });
          }
        }
      ],
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  };
}

export function updateSubmission(id, body) {
  return {
    [RSAA]: {
      endpoint: `${BASE_URL}/api/submission/${id}`,
      method: "PUT",
      types: [
        UPDATE_SUBMISSION_REQUEST,
        UPDATE_SUBMISSION_SUCCESS,
        {
          type: UPDATE_SUBMISSION_FAILURE,
          payload: (action, state, res) => {
            return res.json().then(data => {
              let message = "Sorry, something went wrong :(";
              if (data && data.message) {
                message = data.message;
              }
              return { message };
            });
          }
        }
      ],
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  };
}

export function getAllSubmissions(token) {
  return {
    [RSAA]: {
      endpoint: `${BASE_URL}/api/submission`,
      method: "GET",
      types: [
        GET_ALL_SUBMISSIONS_REQUEST,
        GET_ALL_SUBMISSIONS_SUCCESS,
        {
          type: GET_ALL_SUBMISSIONS_FAILURE,
          payload: (action, state, res) => {
            return res.json().then(data => {
              let message = "Sorry, something went wrong :(";
              if (data && data.message) {
                message = data.message;
              }
              return { message };
            });
          }
        }
      ],
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  };
}

export function saveSalesforceId(id) {
  return {
    type: SAVE_SALESFORCEID,
    payload: { salesforceId: id }
  };
}

export function saveSubmissionId(id) {
  return {
    type: SAVE_SUBMISSIONID,
    payload: { submissionId: id }
  };
}

export function verify(token, ip_address) {
  return {
    [RSAA]: {
      endpoint: `${BASE_URL}/api/verify`,
      method: "POST",
      types: [
        VERIFY_REQUEST,
        VERIFY_SUCCESS,
        {
          type: VERIFY_FAILURE,
          payload: (action, state, res) => {
            return res.json().then(data => {
              let message = "Sorry, something went wrong :(";
              if (data && data.message) {
                message = data.message;
              }
              return { message };
            });
          }
        }
      ],
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token, ip_address })
    }
  };
}

export function loadRecaptchaScript() {
  return {
    [RSAA]: {
      endpoint: `${BASE_URL}/api/recaptcha`,
      method: "GET",
      types: [
        LOAD_RECAPTCHA_REQUEST,
        LOAD_RECAPTCHA_SUCCESS,
        {
          type: LOAD_RECAPTCHA_FAILURE,
          payload: (action, state, res) => {
            return res.json().then(data => {
              let message = "Sorry, something went wrong :(";
              if (data && data.message) {
                message = data.message;
              }
              return { message };
            });
          }
        }
      ],
      headers: {
        "Content-Type": "application/json"
      }
    }
  };
}

export function createCAPE(body) {
  return {
    [RSAA]: {
      endpoint: `${BASE_URL}/api/cape`,
      method: "POST",
      types: [
        CREATE_CAPE_REQUEST,
        CREATE_CAPE_SUCCESS,
        {
          type: CREATE_CAPE_FAILURE,
          payload: (action, state, res) => {
            return res.json().then(data => {
              let message = "Sorry, something went wrong :(";
              if (data && data.message) {
                message = data.message;
              }
              return { message };
            });
          }
        }
      ],
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  };
}

export function updateCAPE(id, body) {
  return {
    [RSAA]: {
      endpoint: `${BASE_URL}/api/cape/${id}`,
      method: "PUT",
      types: [
        UPDATE_CAPE_REQUEST,
        UPDATE_CAPE_SUCCESS,
        {
          type: UPDATE_CAPE_FAILURE,
          payload: (action, state, res) => {
            return res.json().then(data => {
              let message = "Sorry, something went wrong :(";
              if (data && data.message) {
                message = data.message;
              }
              return { message };
            });
          }
        }
      ],
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  };
}

export function getCAPEBySFId(id) {
  return {
    [RSAA]: {
      endpoint: `${BASE_URL}/api/capeBySF/${id}`,
      method: "GET",
      types: [
        GET_CAPE_BY_SFID_REQUEST,
        GET_CAPE_BY_SFID_SUCCESS,
        {
          type: GET_CAPE_BY_SFID_FAILURE,
          payload: (action, state, res) => {
            return res.json().then(data => {
              let message = "Sorry, something went wrong :(";
              if (data && data.message) {
                message = data.message;
              }
              return { message };
            });
          }
        }
      ],
      headers: {
        "Content-Type": "application/json"
      }
    }
  };
}
