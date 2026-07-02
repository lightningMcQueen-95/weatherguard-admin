import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface WeatherSnapshot {
  temperatureC: number;
  windSpeedKph: number;
  condition: string;
  alertWorthy: boolean;
  raw: any;
}

// Open-Meteo WMO weather codes that we treat as alert-worthy
// (thunderstorms, heavy rain/snow, freezing conditions, etc.)
const SEVERE_CODES = new Set([45, 48, 65, 67, 75, 77, 82, 86, 95, 96, 99]);

function describeCode(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Freezing fog',
    51: 'Light drizzle',
    61: 'Light rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Light snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm with hail',
  };
  return map[code] ?? `Weather code ${code}`;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  async getCurrent(lat: number, lon: number): Promise<WeatherSnapshot> {
    const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,wind_speed_10m,weather_code',
      },
    });

    const code = data.current.weather_code;

    return {
      temperatureC: data.current.temperature_2m,
      windSpeedKph: data.current.wind_speed_10m,
      condition: describeCode(code),
      alertWorthy: SEVERE_CODES.has(code),
      raw: data.current,
    };
  }
}
