# SplitBill

![SplitBill Logo](/public/logo-splitbill.svg)

## Overview

SplitBill is a modern web application designed to simplify the process of splitting bills among friends, colleagues, or family members. With an intuitive interface and powerful features, SplitBill makes it easy to scan receipts, automatically extract items, split costs, and share the results with others.

## Key Features

### Receipt Management

- **Upload & Scan**: Easily upload receipt images or scan them directly
- **AI-Powered Recognition**: Automatically extracts items, prices, and restaurant details
- **Manual Editing**: Ability to manually adjust items and prices if needed

### Bill Splitting

- **Smart Splitting**: Divide bills evenly or by specific items
- **Item Assignment**: Assign items to specific people
- **Tax & Tip Calculation**: Automatically handle tax and tip calculations

### Sharing & Exporting

- **Receipt Viewer**: View detailed bill information in a clean, organized format
- **Export as Image**: Save receipts as images for easy sharing
- **WhatsApp Integration**: Share bill splits directly via WhatsApp
- **Receipt History**: Access all your past receipts and splits

### User Experience

- **Guest Mode**: Use the app without creating an account
- **OAuth Authentication**: Quick sign-in with your existing accounts
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices

## Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Authentication**: OAuth via Arctic
- **Storage**: AWS S3 for image storage
- **UI Components**: HeadlessUI, HeroUI, Framer Motion
- **Database**: Prisma

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Database setup (compatible with Prisma)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/splitbill.git
cd splitbill
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=your_database_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=localhost_or_your_domain
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_s3_bucket_name
```

4. Run database migrations:

```bash
npm run db:migrate
# or
yarn db:migrate
```

5. Start the development server:

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage Flow

1. **Login or Continue as Guest**: Access the app with or without an account
2. **Upload a Receipt**: Take a photo or upload an image of your receipt
3. **Review & Edit**: Verify the extracted items and make any necessary adjustments
4. **Split the Bill**: Assign items to different people or split evenly
5. **Share Results**: Export the split as an image or share directly via WhatsApp

## Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run db:migrate` - Apply database migrations
- `npm run db:studio` - Open Prisma Studio to view and edit data

## Contributing

We welcome contributions to SplitBill! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Our team for their valuable effort and enthusiasm
