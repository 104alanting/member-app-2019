import React from "react";
import { shallow } from "enzyme";
import { findByTestAttr } from "../../utils/testUtils";
import Login from "../../components/Login";

const defaultProps = {
  classes: {}
};

/**
 * Factory function to create a ShallowWrapper for the FormThankyou component
 * @function setup
 * @param  {object} props - Component props specific to this setup.
 * @return {ShallowWrapper}
 */
const setup = (props = {}) => {
  const setupProps = { ...defaultProps, ...props };
  return shallow(<Login {...setupProps} />);
};

const assignMock = jest.fn();

describe.only("<Login />", () => {
  beforeEach(() => {
    window.location.assign = assignMock;
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("renders without error", () => {
    const wrapper = setup();
    const component = findByTestAttr(wrapper, "component-login");
    expect(component.length).toBe(1);
  });
  it("assigns location on componentDidMount", () => {
    const wrapper = setup();
    // run lifecycle method
    wrapper.instance().componentDidMount();
    expect(assignMock.mock.calls.length).toBe(1);
  });
});
