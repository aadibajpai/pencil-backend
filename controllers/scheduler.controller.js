import fetch from 'node-fetch';

// List of valid locations. TODO: query from location database
const LOCATIONS = ['nashville', 'antioch'];

/**
 * Returns the current organization URI that will be
 * used to query for Calendly events
 */
const getCurrentUser = async () => {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SCHEDULER_BEARER_AUTH_TOKEN}`,
    },
  };
  return fetch('https://api.calendly.com/users/me', options)
    .then((data) => data.json())
    .catch((err) => console.log('error:', err));
};

const listEvents = async (organization) => {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SCHEDULER_BEARER_AUTH_TOKEN}`,
    },
  };
  return fetch(
    `https://api.calendly.com/scheduled_events/?organization=${encodeURIComponent(
      organization
    )}`,
    options
  )
    .then((data) => data.json())
    .catch((err) => console.log('error:', err));
};

const findEventWithLocation = (eventCollection, locationToFind) => {
  let eventIndex = -1;
  // loop through eventsCollection to find the index where event name contains location
  eventCollection.forEach((event, index) => {
    if (event.name.toLowerCase().includes(locationToFind)) {
      eventIndex = index;
    }
  });

  if (eventIndex !== -1) return eventCollection[eventIndex];

  // Throw an error if location name is not found in any of the calendly events name
  // eslint-disable-next-line no-throw-literal
  throw {
    error:
      'The requested location name is not found in any of the Calendly events name',
  };
};

const listEventInvitees = async (eventUuid) => {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SCHEDULER_BEARER_AUTH_TOKEN}`,
    },
  };
  return fetch(
    `https://api.calendly.com/scheduled_events/${eventUuid}/invitees`,
    options
  )
    .then((data) => data.json())
    .catch((err) => console.log('error:', err));
};

const getEvent = async (uuid) => {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SCHEDULER_BEARER_AUTH_TOKEN}`,
    },
  };
  return fetch(`https://api.calendly.com/scheduled_events/${uuid}`, options)
    .then((data) => data.json())
    .catch((err) => console.log('error:', err));
};

/**
 *
 * @param {Object} req - Request object.
 * @param {Object} res - Response object.
 * @param {function} next - Next middleware.
 * @param {string} loc - The location passed to endpoint param
 * @return {Object} -
 */
// eslint-disable-next-line consistent-return
const locationParam = async (req, res, next, loc) => {
  const locationString = loc.toLowerCase();
  if (!LOCATIONS.includes(locationString)) {
    return res
      .status(403)
      .json({ error: 'The requested location is not found in database' });
  }
  req.profile = locationString;
  return next();
};

/**
 * Get schedule from Calendly by making sequential API calls
 *
 * @description   1. Retrieve location from request profile
 *                2. Perform a GET request on calendly's GET-CURRENT-USER endpoint
 *                3. Perform a GET request on calendly's LIST-EVENTS endpoint
 *                4. Find the event that contains the location param
 *                5. Perform a GET request on calendly's LIST-EVENT-INVITEES endpoint
 *                6. Filter each invitees to keep only the relevant parameters
 *                7. Perform a GET request on calendly's GET-EVENT to add start/end
 *                    time information to invitee object
 */
const getSchedule = async (req, res) => {
  try {
    // 1. Retrieve location from request profile
    const location = req.profile;
    // 2. Perform a GET request on calendly's GET-CURRENT-USER endpoint
    const jsonResponse = await getCurrentUser()
      .then((userData) =>
        // 3. Perform a GET request on calendly's LIST-EVENTS endpoint
        listEvents(userData.resource.current_organization)
      )
      .then((eventsList) =>
        // 4. Find the event that contains the location param
        findEventWithLocation(eventsList.collection, location)
      )
      .then((eventData) => {
        // 5. Perform a GET request on calendly's LIST-EVENT-INVITEES endpoint
        const eventUuid = eventData.uri.split('/').pop();
        return listEventInvitees(eventUuid);
      })
      .then((inviteesCollection) => {
        // 6. Filter each invitees to keep only the relevant parameters
        const { collection } = inviteesCollection;
        const invitees = collection.map((item) => ({
          name: item.name,
          email: item.email,
          uri: item.uri,
          school: item.questions_and_answers[0].answer,
          phone: item.questions_and_answers[1].answer,
        }));
        return invitees;
      })
      .then((invitees) => {
        // 7. Perform a GET request on calendly's GET-EVENT to add start/end
        //    time information to invitee object
        const schedule = Promise.all(
          invitees.map((invitee) => {
            // Perform the GET request for each user
            const inviteeEventUuid = invitee.uri.split('/')[4]; // get uuid
            return getEvent(inviteeEventUuid).then((data) => {
              // add start and end times to the invitee object
              const newInviteeObject = {
                ...invitee,
                ...{ start_time: data.resource.start_time },
                ...{ end_time: data.resource.end_time },
              };
              return newInviteeObject;
            });
          })
        );
        return schedule;
      })
      .catch((err) => err);
    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.log(err);
    return { err: 'Error getting schedule' };
  }
};

export default {
  getSchedule,
  locationParam,
};