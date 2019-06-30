import fetchMock from "fetch-mock";
import { apiMiddleware, ApiError } from "redux-api-middleware";
import configureMockStore from "redux-mock-store";
import * as actions from "../../store/actions/apiContentActions";
import * as contentReducer from "../../store/reducers/content";

const createStore = configureMockStore([apiMiddleware]);
const store = createStore(contentReducer.initialState);
const mockResponse = (status, statusText, response) => {
  return new window.Response(response, {
    status,
    statusText,
    headers: {
      "Content-type": "application/json"
    }
  });
};

describe("apiContentActions", () => {
  it("should create an action to handle form input", () => {
    const e = { target: { name: "headline", value: "test headline content" } };
    const expectedAction = {
      type: "HANDLE_INPUT",
      payload: { name: "headline", value: "test headline content" }
    };
    expect(actions.handleInput(e)).toEqual(expectedAction);
  });

  it("should create an action to open the delete dialog", () => {
    const selectedContent = {
      content_type: "headline",
      content: "test headline"
    };
    const expectedAction = {
      type: "HANDLE_DELETE_OPEN",
      payload: { selectedContent }
    };
    expect(actions.handleDeleteOpen(selectedContent)).toEqual(expectedAction);
  });

  it("should create an action to close the delete dialog", () => {
    const expectedAction = {
      type: "HANDLE_DELETE_CLOSE"
    };
    expect(actions.handleDeleteClose()).toEqual(expectedAction);
  });

  it("should create an action to clear the form", () => {
    const expectedAction = {
      type: "CLEAR_FORM"
    };
    expect(actions.clearForm()).toEqual(expectedAction);
  });

  describe("api actions", () => {
    afterEach(() => {
      fetchMock.reset();
      fetchMock.restore();
    });

    it("GET_CONTENT_BY_ID: Dispatches request and success actions after successful fetch", () => {
      // Response body sample
      const response = {
        content_type: "headline",
        content: "Test headline",
        id: "1651a5d6-c2f7-453f-bdc7-13888041add6"
      };

      fetchMock.getOnce("/api/content/1651a5d6-c2f7-453f-bdc7-13888041add6", {
        body: { results: response }
      });

      const expectedActions = [
        { type: "GET_CONTENT_BY_ID_REQUEST", payload: undefined },
        { type: "GET_CONTENT_BY_ID_SUCCESS", payload: { results: response } }
      ];
      store
        .dispatch(
          actions.getContentById("1651a5d6-c2f7-453f-bdc7-13888041add6")
        )
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
        });
    });

    it("GET_CONTENT_BY_ID: Dispatches request and failure actions after failed fetch", () => {
      fetchMock.getOnce("/api/content/1651a5d6-c2f7-453f-bdc7-13888041add6", {
        body: { results: { error: { status: 400, statusText: "Test Error" } } }
      });

      const expectedActions = [
        // { type: 'GET_CONTENT_BY_ID_REQUEST', payload: undefined},
        {
          type: "GET_CONTENT_BY_ID_FAILURE",
          payload: { error: { status: 400, statusText: "Test Error" } }
        }
      ];
      console.log(expectedActions);

      store
        .dispatch(
          actions.getContentById("1651a5d6-c2f7-453f-bdc7-13888041add6")
        )
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
          console.log(store.getActions());
        });
      console.log(store.getActions());
    });
  });
});
