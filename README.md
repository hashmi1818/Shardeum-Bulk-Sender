# Shardeum Bulk Sender DApp

A modern, beautifully designed decentralized application (DApp) for sending ERC-20 tokens and native SHM tokens to multiple wallet addresses in a single batch on the Shardeum UnstableNet network.

This project provides a premium, responsive user interface with advanced animations, glass morphism effects, and intuitive design patterns to facilitate bulk transfers efficiently.

## ✨ Features

### 🎨 **Modern UI/UX**
- **Glass Morphism Design**: Beautiful backdrop blur effects and translucent elements
- **Gradient Accents**: Modern color schemes with smooth transitions
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Smooth Animations**: Hover effects, transitions, and micro-interactions
- **Dark Theme**: Professional dark color scheme with excellent contrast

### 🚀 **Core Functionality**
- **Dual Send Modes**: Toggle between sending native **SHM** tokens and any **ERC-20** token
- **Wallet Integration**: Seamless MetaMask connection with automatic network switching
- **Bulk Operations**: Send to multiple addresses efficiently in a single batch
- **Real-time Logging**: Live transaction status updates with block explorer links

### 🔧 **Advanced Features**
- **Automatic Network Detection**: Prompts to switch to Shardeum UnstableNet if needed
- **Smart Input Validation**: Address validation, amount checking, and duplicate detection
- **Dynamic Token Loading**: Auto-fetches ERC-20 token details from contract addresses
- **Transaction Summary**: Clear overview of total amounts and balance verification
- **Sequential Processing**: Handles transactions one-by-one with user confirmation

### 📱 **Mobile Experience**
- **PWA Support**: Install as a mobile app with offline capabilities
- **Touch Optimized**: Large touch targets and mobile-friendly interactions
- **Responsive Design**: Adapts perfectly to all screen sizes
- **App Shortcuts**: Quick access to common functions

## 🎯 **Network Details**

The DApp is configured to work with the following network:

- **Network Name**: Shardeum UnstableNet
- **RPC URL**: `https://api-unstable.shardeum.org`
- **Chain ID**: `8080`
- **Block Explorer**: `https://explorer-unstable.shardeum.org`

## 🚀 **Getting Started**

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### **Prerequisites**

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Yarn](https://yarnpkg.com/) or npm
- [MetaMask](https://metamask.io/) browser extension

### **Installation**

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   This project uses a modern setup without a traditional build step, relying on `importmap` and CDN links.

### **Running Locally**

To serve the `index.html` file, you can use a simple local server:

1. **Install `serve` globally:**
   ```sh
   npm install -g serve
   ```

2. **Run the server from the project's root directory:**
   ```sh
   serve .
   ```
   
   The application will be available at `http://localhost:3000` (or another port if 3000 is busy).

## 📖 **How to Use the DApp**

### **1. Connect Your Wallet**
- Click the prominent "Connect Wallet" button
- MetaMask will prompt for connection and network switching
- Automatically switches to Shardeum UnstableNet

### **2. Select Send Mode**
- **Native SHM**: Send the network's native token
- **ERC-20 Token**: Send any ERC-20 token by providing the contract address

### **3. Configure Token (ERC-20 Mode)**
- Paste the ERC-20 contract address
- DApp automatically fetches token details (name, symbol, decimals, balance)
- Visual confirmation when token is successfully loaded

### **4. Add Recipients**
- **Manual Input**: Paste addresses and amounts in the format `address, amount` per line
- **File Upload**: Upload CSV or TXT files with the same format
- **Smart Parsing**: Click "Parse Input" to validate and process the data

### **5. Review and Send**
- **Recipient List**: See all validated addresses and amounts
- **Transaction Summary**: Review total amount and verify sufficient balance
- **Batch Send**: Click "Send to X addresses" to begin the process
- **Sequential Signing**: Approve each transaction in MetaMask as prompted

### **6. Monitor Progress**
- **Real-time Logs**: Watch transaction status updates in the log panel
- **Block Explorer Links**: Click transaction hashes to view on Shardeum explorer
- **Balance Updates**: Automatic balance refresh after successful transactions

## 🎨 **UI Components**

### **Enhanced Cards**
- Glass morphism effects with backdrop blur
- Smooth hover animations and shadows
- Consistent spacing and typography

### **Smart Buttons**
- Multiple variants (primary, secondary, success, danger)
- Hover effects with scale transformations
- Loading states with spinners

### **Interactive Elements**
- Smooth focus transitions on inputs
- Hover effects on interactive components
- Responsive grid layouts


## 🔧 **Technical Details**

### **Frontend Technologies**
- **React 19**: Latest React with modern hooks and patterns
- **TypeScript**: Full type safety and better development experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Ethers.js**: Ethereum library for blockchain interactions

### **Performance Features**
- **Lazy Loading**: Components load as needed
- **Optimized Animations**: CSS-based animations with reduced motion support
- **Responsive Images**: Optimized for different screen densities
- **PWA Capabilities**: Offline support and app-like experience

### **Accessibility**
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast Mode**: Support for accessibility preferences
- **Reduced Motion**: Respects user motion preferences

## 📱 **Mobile Features**

### **PWA Capabilities**
- **Install Prompt**: Add to home screen on mobile devices
- **Offline Support**: Basic offline functionality
- **App Shortcuts**: Quick access to common functions
- **Responsive Design**: Optimized for all screen sizes


## 📄 **License**

This project is open source and available under the [MIT License](LICENSE).

## 🙏 **Acknowledgments**

- Built for the Shardeum ecosystem
- Inspired by modern DeFi applications
- Uses open source libraries and tools
- Community feedback and contributions

