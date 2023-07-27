// const properties = require("./json/properties.json");
// const users = require("./json/users.json");

const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = (email) => {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithId = (id) => {
  return pool
  .query(`SELECT * FROM users WHERE id = $1`, [id])
  .then((results) => {
    console.log(results.rows[0]);
    return results.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

const addUser = (user) => {
  const {name, email, password} = user;

  return pool
    .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3)`, [name, email, password])
    .then((results) => {
      console.log(results.rows[0]);
      return results.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

const getAllReservations = (guest_id, limit = 10) => {
  return pool
    .query(`SELECT reservations.*, properties.*, avg(rating) as average_rating
            FROM reservations
            JOIN properties ON reservations.property_id = properties.id
            JOIN property_reviews ON properties.id = property_reviews.property_id
            WHERE reservations.guest_id = $1
            GROUP BY properties.id, reservations.id
            ORDER BY reservations.start_date
            LIMIT $2;`, [guest_id, limit])
    .then((results) => {
      console.log(results.rows);
      return results.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

// const getAllProperties = (options, limit = 10) => {
//   return pool
//     .query(`SELECT * FROM properties LIMIT $1`, [limit])
//     .then((result) => {
//       console.log(result.rows);
//       return result.rows;
//     })
//     .catch((err) => {
//       console.log(err.message);
//     });
// };

const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  const {city, owner_id, minimum_price_per_night, maximum_price_per_night, minimum_rating} = options
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  // city
  if (city) {
    queryParams.push(`%${city}%`);
    queryString += `WHERE LOWER(city) LIKE LOWER($${queryParams.length}) `;
  }

  // owner_id
  if (owner_id) {
    queryParams.push(`${owner_id}`);
    queryString += `AND owner_id = $${queryParams.length} `;
  }

  // minimum_price_per_night
  if (minimum_price_per_night) {
    queryParams.push(`${minimum_price_per_night}`);
    queryString += `AND cost_per_night / 100 >= $${queryParams.length} `;
  }

  // maximum_price_per_night
  if (maximum_price_per_night) {
    queryParams.push(`${maximum_price_per_night}`);
    queryString += `AND cost_per_night / 100 <= $${queryParams.length} `;
  }

  queryString += `
  GROUP BY properties.id
  `;

  // minimum_rating
  if (minimum_rating) {
    queryParams.push(`${minimum_rating}`);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }

  // 4
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
// const addProperty = function (property) {
//   const propertyId = Object.keys(properties).length + 1;
//   property.id = propertyId;
//   properties[propertyId] = property;
//   return Promise.resolve(property);
// };

const addProperty = (property) => {
  const {owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, 
    province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms} = property;
  let queryString = `INSERT INTO properties(
  owner_id,
  title,
  description,
  thumbnail_photo_url,
  cover_photo_url,
  cost_per_night,
  street,
  city,
  province,
  post_code,
  country,
  parking_spaces,
  number_of_bathrooms,
  number_of_bedrooms
  )
  values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
RETURNING *;` 

const values = [owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night * 100, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms]
return pool
    .query(queryString, values)
    .then((results) => {
      console.log(results.rows);
    })
  .catch((err) => {
    console.log(err.message);
  });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
