const options = { year: "numeric", month: "short", day: "numeric" };

export const formatDate = date =>
  new Date(date).toLocaleDateString("en-US", options);

// force focus on #main when using skip navigation link
// (some browsers will only focus form inputs, links, and buttons)
export const skip = targetId => {
  const removeTabIndex = e => {
    e.target.removeAttribute("tabindex");
  };
  const skipTo = document.getElementById(targetId);
  // Setting 'tabindex' to -1 takes an element out of normal
  // tab flow but allows it to be focused via javascript
  skipTo.tabIndex = -1;
  skipTo.focus(); // focus on the content container
  // console.log(document.activeElement);
  // when focus leaves this element,
  // remove the tabindex attribute
  skipTo.addEventListener("blur", removeTabIndex);
};

export const labelsObj = {
  headline: "headline",
  bodyCopy: "body copy",
  image: "image",
  redirectUrl: "redirect URL"
};

export const randomInt = () => {
  const min = 100;
  const max = 999;
  return Math.floor(Math.random() * (+max - +min)) + +min;
};

export const camelize = str => {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index == 0 ? match.toLowerCase() : match.toUpperCase();
  });
};
