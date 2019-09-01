import { RSAA } from "redux-api-middleware";
import BASE_URL from "./apiConfig.js";

export const ADD_SUBMISSION_REQUEST = "ADD_SUBMISSION_REQUEST";
export const ADD_SUBMISSION_SUCCESS = "ADD_SUBMISSION_SUCCESS";
export const ADD_SUBMISSION_FAILURE = "ADD_SUBMISSION_FAILURE";
export const SAVE_SALESFORCEID = "SAVE_SALESFORCEID";
export const UPDATE_SUBMISSION_REQUEST = "UPDATE_SUBMISSION_REQUEST";
export const UPDATE_SUBMISSION_SUCCESS = "UPDATE_SUBMISSION_SUCCESS";
export const UPDATE_SUBMISSION_FAILURE = "UPDATE_SUBMISSION_FAILURE";
export const HANDLE_INPUT = "HANDLE_INPUT";

export function handleInput({ target: { name, value } }) {
  console.log(name, value);
  return {
    type: HANDLE_INPUT,
    payload: { name, value }
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

export function saveSalesforceId(id) {
  return {
    type: SAVE_SALESFORCEID,
    payload: { salesforceId: id }
  };
}
