import React from "react";
import { shallow, mount } from "enzyme";
import { findByTestAttr } from "../../utils/testUtils";
import {
  LinkRequestConnected,
  LinkRequestUnconnected
} from "../../containers/LinkRequest";
import * as Notifier from "../../containers/Notifier";

import configureMockStore from "redux-mock-store";
const mockStore = configureMockStore();

let store,
  wrapper,
  lookupSFContactErrorMock,
  apiSF = {},
  lookupSFContact;

// let pushMock = jest.fn();

// const initialState = {
//   submission: {
//     formPage1: {
//       firstName: "",
//       lastName: "",
//       email: ""
//     },
//     loading: false
//   },
//   apiSubmission: {
//     handleInput: () => ({ type: "HANDLE_INPUT" }),
//     clearForm: () => ({ type: "CLEAR_FORM" }),
//   },
//   apiSF: {
//     lookupSFContact: () => Promise.resolve({ type: "LOOKUP_SF_CONTACT_SUCCESS" })
//   },
//   classes: {
//     test: "test"
//   }
// };

const defaultProps = {
  submission: {
    formPage1: {
      firstName: "",
      lastName: "",
      email: ""
    },
    loading: false
  },
  apiSubmission: {
    handleInput: () => ({ type: "HANDLE_INPUT" }),
    clearForm: () => ({ type: "CLEAR_FORM" })
  },
  apiSF: {
    lookupSFContact: fn => jest.fn()
  },
  classes: {
    test: "test"
  },
  history: {
    push: jest.fn()
  }
};

/**
 * Factory function to create a ShallowWrapper for the Dashboard component
 * @function setup
 * @param  {object} props - Component props specific to this setup.
 * @return {ShallowWrapper}
 */
const setup = (props = {}) => {
  store = mockStore(defaultProps);
  const setupProps = { ...defaultProps, ...props };
  return shallow(<LinkRequestUnconnected {...setupProps} store={store} />);
};

describe("<LinkRequest />", () => {
  it("renders without error", () => {
    wrapper = setup();
    const component = findByTestAttr(wrapper, "component-link-request");
    expect(component.length).toBe(1);
  });

  it("renders connected component", () => {
    store = mockStore(defaultProps);
    wrapper = mount(<LinkRequestConnected {...defaultProps} store={store} />);
    const component = findByTestAttr(wrapper, "component-link-request");
    expect(component.length).toBe(1);
  });

  it("should have access to expected props", () => {
    wrapper = setup();
    expect(wrapper.instance().props.submission.loading).toBe(false);
  });

  test("calls `handleInput` on input change", () => {
    const handleInputMock = jest.fn().mockImplementation(() => {
      return { type: "HANDLE_INPUT" };
    });
    store = mockStore(defaultProps);
    const props = { apiSubmission: { handleInput: handleInputMock } };
    wrapper = mount(
      <LinkRequestConnected {...defaultProps} {...props} store={store} />
    );
    const inputFirstName = findByTestAttr(wrapper, "firstName").first();
    const inputLastName = findByTestAttr(wrapper, "lastName").first();
    const inputHomeEmail = findByTestAttr(wrapper, "homeEmail").first();
    const inputs = [inputFirstName, inputLastName, inputHomeEmail];
    inputs.forEach(input => {
      input.prop("onChange")({
        target: { name: input.props().name, value: "words" }
      });
      console.log(
        input
          .props()
          .onChange({ target: { name: input.props().name, value: "words" } })
      );
    });
    inputFirstName.prop("onChange")({
      target: { name: "firstName", value: "words" }
    });
    inputLastName.prop("onChange")({
      target: { name: "lastName", value: "words" }
    });
    inputHomeEmail.prop("onChange")({
      target: { name: "homeEmail", value: "words" }
    });
    // expect the mock to have been called three times
    expect(handleInputMock.mock.calls.length).toBe(3);

    // restore mock
    handleInputMock.mockRestore();
  });

  test("calls `lookupSFContact` prop on submit", () => {
    const lookupSFContactMock = jest.fn().mockImplementation(() =>
      Promise.resolve({
        type: "LOOKUP_SF_CONTACT_SUCCESS",
        payload: { salesforce_id: 123 }
      })
    );
    const props = { apiSF: { lookupSFContact: lookupSFContactMock } };

    wrapper = shallow(<LinkRequestUnconnected {...defaultProps} {...props} />);
    wrapper.find("form").simulate("submit", { preventDefault: jest.fn() });

    // expect the mock to have been called once on submit
    expect(lookupSFContactMock.mock.calls.length).toBe(1);

    // restore mock
    lookupSFContactMock.mockRestore();
  });

  test("lookupSFContact returns error message if api call fails", () => {
    lookupSFContactErrorMock = jest.fn().mockImplementation(() =>
      Promise.resolve({
        type: "LOOKUP_SF_CONTACT_FAILURE",
        payload: { sf_contact_id: undefined }
      })
    );
    lookupSFContact = lookupSFContactErrorMock;
    apiSF.lookupSFContact = lookupSFContact;
    const props = {
      apiSF: apiSF
    };
    wrapper = shallow(<LinkRequestUnconnected {...defaultProps} {...props} />);
    wrapper.find("form").simulate("submit", { preventDefault: jest.fn() });

    // expect the mock to have been called once on submit
    expect(lookupSFContactErrorMock.mock.calls.length).toBe(1);

    // replacing openSnackbar import with mock function
    Notifier.openSnackbar = jest.fn();

    // expect openSnackbar to be called when API call fails
    return lookupSFContactErrorMock().then(() => {
      expect(Notifier.openSnackbar.mock.calls.length).toBe(1);
      // restore mocks
      lookupSFContactErrorMock.mockRestore();
      Notifier.openSnackbar.mockRestore();
    });
  });
});
