import React from "react";
import { shallow, mount } from "enzyme";
import sinon from "sinon";
import configureStore from "redux-mock-store";

// Needed to create simple store to test connected component
import { reducer as formReducer } from "redux-form";
import { createStore, combineReducers } from "redux";
import { Provider } from "react-redux";
import { unwrap, createShallow } from "@material-ui/core/test-utils";

import { generateSampleValidate } from "../../../../app/utils/fieldConfigs";
import SubmissionForm, {
  SubmissionFormReduxForm
} from "../../containers/SubmissionForm";
import { findByTestAttr } from "../../utils/testUtils";

// variables
let wrapper,
  touched,
  error,
  addSubmissionMock,
  mockStore,
  addSubmissionErrorMock,
  handleSubmitMock,
  testData,
  store,
  submitting,
  loading;

// const SubmissionFormNaked = unwrap(SubmissionForm);

// create simple initial state
const defaultProps = {
  submission: {
    error: null,
    loading: false
  },
  initialValues: {
    mm: "",
    onlineCampaignSource: null
  },
  formValues: {
    mm: "",
    onlineCampaignSource: null
  },
  classes: {},
  fields: {
    firstName: {
      value: "",
      touched: touched,
      error: error
    }
  }
};
const options = {
  untilSelector: "ContentTile"
};
const muiShallow = createShallow(options);

// setup for redux-form wrapped component... I think
const connectedSetup = (props = {}) => {
  // create basic store
  mockStore = createStore(combineReducers({ form: formReducer }));
  addSubmissionMock = jest.fn();
  addSubmissionErrorMock = jest.fn();
  handleSubmitMock = jest.fn();
  // props to pass to test subject
  props = {
    ...defaultProps,
    apiSubmission: {
      addSubmission: addSubmissionMock,
      addSubmissionError: addSubmissionErrorMock
    },
    handleSubmit: handleSubmitMock
  };

  // mockConnected component with props
  let subject = mount(
    <Provider store={mockStore} {...defaultProps}>
      <SubmissionFormReduxForm {...props} />
    </Provider>
  );
  return subject;
};

describe("Connected Form", () => {
  beforeEach(() => {
    submitting = false;
    touched = false;
    error = true;
    loading = false;
    wrapper = connectedSetup();
  });
  afterEach(() => {
    addSubmissionMock.mockRestore();
    addSubmissionErrorMock.mockRestore();
    handleSubmitMock.mockRestore();
  });
  test("calls handleSubmit", () => {
    testData = generateSampleValidate();
    const form = wrapper.find(`[id="submissionForm"]`);
    wrapper.setState({
      form: { values: generateSampleValidate }
    });
    form.simulate("submit");
    expect(handleSubmitMock.mock.calls.length).toBe(2);
  });
});
