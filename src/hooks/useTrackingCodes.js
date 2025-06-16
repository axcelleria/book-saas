import { useEffect } from 'react';
import { getActiveTrackingCodes } from '../services/trackingService';

export const useTrackingCodes = () => {
  useEffect(() => {
    const insertCode = (codes, position) => {
      // Remove any existing tracking elements
      document.querySelectorAll(`[data-tracking="${position}"]`)
        .forEach(el => el.remove());

      // Create container for tracking code
      const container = document.createElement('div');
      container.setAttribute('data-tracking', position);
      container.innerHTML = codes.map(code => code.code).join('\n');

      // Insert based on position
      switch (position) {
        case 'head':
          document.head.appendChild(container);
          break;
        case 'body-start':
          document.body.insertBefore(container, document.body.firstChild);
          break;
        case 'body-end':
          document.body.appendChild(container);
          break;
      }
    };

    const loadTrackingCodes = async () => {
      try {
        const [head, bodyStart, bodyEnd] = await Promise.all([
          getActiveTrackingCodes('head'),
          getActiveTrackingCodes('body-start'),
          getActiveTrackingCodes('body-end')
        ]);

        if (head.length) {
          const headCode = head.map(code => code.code).join('\n');
          insertCode(head, 'head');
        }

        if (bodyStart.length) {
          const bodyStartCode = bodyStart.map(code => code.code).join('\n');
          insertCode(bodyStart, 'body-start');
        }

        if (bodyEnd.length) {
          const bodyEndCode = bodyEnd.map(code => code.code).join('\n');
          insertCode(bodyEnd, 'body-end');
        }
      } catch (error) {
        console.error('Error loading tracking codes:', error);
      }
    };

    loadTrackingCodes();

    // Cleanup function
    return () => {
      ['head', 'body-start', 'body-end'].forEach(position => {
        document.querySelectorAll(`[data-tracking="${position}"]`)
          .forEach(el => el.remove());
      });
    };
  }, []);
};
