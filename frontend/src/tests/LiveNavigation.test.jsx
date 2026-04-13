import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LiveNavigation from '../pages/LiveNavigation';
import React from 'react';

vi.mock('@googlemaps/js-api-loader', () => ({
  setOptions: vi.fn(),
  importLibrary: vi.fn().mockImplementation((lib) => {
    window.google = {
      maps: {
        marker: {
          AdvancedMarkerElement: class {
            constructor({ map, position, title, content }) {
              this.map = map;
              this.position = position;
              this.title = title;
              this.content = content;
            }
          },
        },
      },
    };

    if (lib === 'maps') {
      return Promise.resolve({
        Map: class {
          setCenter() {}
        },
      });
    }

    if (lib === 'marker') {
      return Promise.resolve({
        AdvancedMarkerElement: window.google.maps.marker.AdvancedMarkerElement,
      });
    }

    return Promise.resolve({});
  }),
}));

describe('LiveNavigation UI and Map Assertions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders reroute alert and gate status when API returns high crowd', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        gates: {
          'Gate 1': { status: 'High', crowdLevel: 85 },
          'Gate 2': { status: 'Low', crowdLevel: 20 },
          'Gate 3': { status: 'Medium', crowdLevel: 50 },
          'Gate 4': { status: 'Low', crowdLevel: 25 }
        },
        alerts: [
          { message: '[System Fallback] Gate 1 is crowded', id: 1 }
        ],
        foodQueues: [
          { name: 'Vegan Bytes', waitTime: 3 }
        ]
      })
    });

    render(<LiveNavigation />);

    expect(global.fetch).toHaveBeenCalledWith('/api/state');

    await waitFor(() => {
      expect(screen.getByText(/Smart AR Reroute Alert/i)).toBeInTheDocument();
      expect(screen.getByText(/Gate 1 is crowded/i)).toBeInTheDocument();
      expect(screen.getByText(/Gate Status/i)).toBeInTheDocument();
    });
  });

  it('calculates the Quickest Bite correctly based on lowest waitTime', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        gates: {
          'Gate 1': { status: 'Low', crowdLevel: 20 },
          'Gate 2': { status: 'Low', crowdLevel: 20 },
          'Gate 3': { status: 'Low', crowdLevel: 20 },
          'Gate 4': { status: 'Low', crowdLevel: 20 }
        },
        alerts: [],
        foodQueues: [
          { name: 'Slow Stall', waitTime: 40 },
          { name: 'Fast Stall', waitTime: 2 }
        ]
      })
    });

    render(<LiveNavigation />);

    await waitFor(() => {
      expect(screen.getByText(/Quickest Food Stall/i)).toBeInTheDocument();
      expect(screen.getByText(/Fast Stall/i)).toBeInTheDocument();
      expect(screen.queryByText(/Slow Stall/i)).not.toBeInTheDocument();
    });
  });
});
