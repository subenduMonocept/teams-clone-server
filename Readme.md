npm init -y

npm install express
npm install typescript @types/express ts-node --save-dev
npm install nodemon --save-dev

npx tsc --init

## modify tsconfig.json

{
"compilerOptions": {
"target": "ES6",
"module": "commonjs",
"strict": true,
"esModuleInterop": true,
"skipLibCheck": true,
"forceConsistentCasingInFileNames": true,
"outDir": "./dist",
"moduleResolution": "node"
},
"include": ["src/**/*.ts"],
"exclude": ["node_modules"]
}

## package.json

-r flag: This is a Node.js option that tells Node.js to require a module before running the script. It allows you to preload a module, meaning it will be loaded first, before the application starts.

ts-node/register: This is a feature of the ts-node library. It allows Node.js to automatically transpile TypeScript to JavaScript on the fly when it tries to run TypeScript files.
