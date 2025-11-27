/**
 * Weatherstack API Response interfaces
 */
export interface WeatherstackLocation {
  name: string;
  country: string;
  region: string;
  lat: string;
  lon: string;
  timezone_id: string;
  localtime: string;
  localtime_epoch: number;
  utc_offset: string;
}

export interface WeatherstackCurrent {
  observation_time: string;
  temperature: number;
  weather_code: number;
  weather_icons: string[];
  weather_descriptions: string[];
  wind_speed: number;
  wind_degree: number;
  wind_dir: string;
  pressure: number;
  precip: number;
  humidity: number;
  cloudcover: number;
  feelslike: number;
  uv_index: number;
  visibility: number;
}

export interface WeatherstackResponse {
  request: {
    type: string;
    query: string;
    language: string;
    unit: string;
  };
  location: WeatherstackLocation;
  current: WeatherstackCurrent;
}

export interface WeatherData {
  temperature: number;
  weather_descriptions: string[];
  humidity: number;
  wind_speed: number;
  observation_time: string;
  feelslike: number;
}
