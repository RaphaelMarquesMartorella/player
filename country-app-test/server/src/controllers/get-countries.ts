import {Request, Response} from 'express'
import axios from 'axios'

export const getAvailableCountries = async (_: Request, res: Response) => {
    try {
        const countries = await axios.get('https://date.nager.at/api/v3/AvailableCountries')
        if (countries.data) res.json({availableCountries: countries.data})
        else res.json({error: 'It was not possible to fetch the data'}).status(404)
    
    } catch (error) {
        console.log(error);
        res.json({error: 'Internal server error'}).status(500)
    }
}

export const getEspecificCountry = async (req: Request, res: Response) => {
    try {
        const {countryCode} = req.params
        const countryInfo = (await axios.get(`https://date.nager.at/api/v3/CountryInfo/${countryCode}`)).data

        if (!countryInfo) res.status(404).json({error: 'It was not possible to find the info from that especific country'})
        
        const countryPopulationResponse = await axios.post('https://countriesnow.space/api/v0.1/countries/population',
            {
                "country": countryInfo.commonName
            }
        )

        const countryPopulation = countryPopulationResponse.data
        if(!countryPopulation) res.status(404).json({error: 'It was not possible to find the population of that especific country'})

        const countryFlagResponse = await axios.post('https://countriesnow.space/api/v0.1/countries/flag/images',
                {
                    "iso2": countryInfo.countryCode
                }
            )

        const countryFlag = countryFlagResponse.data
            if(!countryFlag) res.status(404).json({error: 'It was not possible to find the Flag of that especific country'})

        res.json({
            borders: countryInfo.borders,
            populationData: countryPopulation.data.populationCounts,
            flagUrl: countryFlag.data.flag
          });
    } catch (error) {
        console.log(error);
        res.json({error: 'Internal server error'}).status(500)
    }
}
    
