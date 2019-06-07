import React from "react";
import PropTypes from "prop-types";

const NotFound = props => {
  return (
    <div className={props.classes.container}>
      404 error. Sorry, page not found.
    </div>
  );
};

NotFound.propTypes = {
  classes: PropTypes.object
};

export default NotFound;
