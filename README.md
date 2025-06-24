# GenieACS Management Interface

This project is a custom frontend interface for GenieACS, providing a modern and user-friendly way to manage TR-069 devices.

## Features

- Modern React-based interface with TypeScript
- Material-UI components for a clean, professional look
- Device management and monitoring
- Real-time device status and parameters
- Device parameter editing with validation
- Responsive design for mobile and desktop
- Built-in API debugging tools (development mode)

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- GenieACS server

## Quick Start

1. **Clone and navigate to the project:**
```bash
cd "c:\Users\carlo\OneDrive\Documents\0 - AplicativoFisio\ACS"
```

2. **Start the complete environment:**
```bash
docker-compose up -d
```

3. **Access the applications:**
   - **Frontend Interface**: http://localhost:3001
   - **GenieACS Web UI**: http://localhost:3000
   - **GenieACS API**: http://localhost:7557

## Development

For frontend development without Docker:

```bash
cd frontend
npm install
npm start
```

This will start the development server with hot reload and API debugging tools.

## Troubleshooting

If you encounter a **405 Method Not Allowed** error:

1. **Check if GenieACS is running:**
```bash
docker-compose ps
```

2. **Test connectivity:**
```powershell
.\test-genieacs.ps1
```

3. **View logs:**
```bash
docker-compose logs genieacs
```

4. **Restart services:**
```bash
docker-compose restart
```

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed problem resolution steps.

This will start:
- MongoDB database
- GenieACS services (cwmp, nbi, fs)
- React frontend development server

The frontend will be available at http://localhost:3000

## Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```
REACT_APP_API_URL=http://localhost:7557
```

## Development

To start the frontend development server:

```bash
cd frontend
npm start
```

## Building for Production

To build the frontend for production:

```bash
cd frontend
npm run build
```

## Docker

The project includes Docker configuration for both development and production environments. The `docker-compose.yml` file sets up all necessary services.

To rebuild the frontend container:

```bash
docker-compose build frontend
```
