import express from 'express';
import { getAvailableCountries, getEspecificCountry } from '../controllers/get-countries';

const router = express.Router();

/**
 * @swagger
 * /api/v1/countries/availableCountries:
 *   get:
 *     summary: Retrieve a list of available countries
 *     description: Fetches a list of all countries available from the external API.
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of countries.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availableCountries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       countryCode:
 *                         type: string
 *                         description: ISO 3166-1 alpha-2 country code.
 *                         example: "US"
 *                       name:
 *                         type: string
 *                         description: The name of the country.
 *                         example: "United States"
 *       500:
 *         description: Internal server error.
 */
router.get('/availableCountries', getAvailableCountries);

/**
 * @swagger
 * /api/v1/countries/countryInfo/{countryCode}:
 *   get:
 *     summary: Retrieve detailed information about a specific country
 *     description: Fetches details about a specific country, including its borders, population data, and flag URL.
 *     parameters:
 *       - in: path
 *         name: countryCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Especific Country Information.
 *     responses:
 *       200:
 *         description: Successfully retrieved country information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 borders:
 *                   type: array
 *                   description: List of countries sharing a border.
 *                   items:
 *                     type: string
 *                     example: "Canada"
 *                 populationData:
 *                   type: array
 *                   description: Historical population data for the country.
 *                   items:
 *                     type: object
 *                     properties:
 *                       year:
 *                         type: integer
 *                         description: Year of the population data.
 *                         example: 2020
 *                       population:
 *                         type: integer
 *                         description: Population in the specified year.
 *                         example: 331002651
 *                 flagUrl:
 *                   type: string
 *                   description: URL to the country's flag image.
 *                   example: "https://example.com/flags/us.png"
 *       404:
 *         description: Country not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/countryInfo/:countryCode', getEspecificCountry);

export default router;
