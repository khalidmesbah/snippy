import type { SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";

export interface SandpackPreset {
  label: string;
  name: string;
  meta: string;
  sandpackTemplate: SandpackPredefinedTemplate;
  sandpackTheme: "light" | "dark";
  snippetFileName: string;
  snippetLanguage: string;
  initialSnippetContent: string;
}

export const sandpackPresets: SandpackPreset[] = [
  // React Ecosystem
  {
    label: "React",
    name: "react",
    meta: "Live React",
    sandpackTemplate: "react",
    sandpackTheme: "light",
    snippetFileName: "/App.js",
    snippetLanguage: "jsx",
    initialSnippetContent: `import React from 'react';

export default function App() {
  return (
    <div>
      <h1>Hello World!</h1>
    </div>
  );
}`,
  },
  {
    label: "React TypeScript",
    name: "react-ts",
    meta: "React with TypeScript",
    sandpackTemplate: "react-ts",
    sandpackTheme: "light",
    snippetFileName: "/App.tsx",
    snippetLanguage: "tsx",
    initialSnippetContent: `import React from 'react';

interface AppProps {
  title?: string;
}

export default function App({ title = "Hello World!" }: AppProps) {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}`,
  },
  {
    label: "Next.js",
    name: "nextjs",
    meta: "Next.js App",
    sandpackTemplate: "nextjs",
    sandpackTheme: "light",
    snippetFileName: "/pages/index.js",
    snippetLanguage: "jsx",
    initialSnippetContent: `export default function Home() {
  return (
    <div>
      <h1>Welcome to Next.js!</h1>
    </div>
  );
}`,
  },
  {
    label: "Vue",
    name: "vue",
    meta: "Vue 3",
    sandpackTemplate: "vue",
    sandpackTheme: "light",
    snippetFileName: "/src/App.vue",
    snippetLanguage: "vue",
    initialSnippetContent: `<template>
  <div id="app">
    <h1>{{ message }}</h1>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      message: 'Hello Vue!'
    }
  }
}
</script>`,
  },
  {
    label: "Vue TypeScript",
    name: "vue-ts",
    meta: "Vue 3 with TypeScript",
    sandpackTemplate: "vue-ts",
    sandpackTheme: "light",
    snippetFileName: "/src/App.vue",
    snippetLanguage: "vue",
    initialSnippetContent: `<template>
  <div id="app">
    <h1>{{ message }}</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App',
  data() {
    return {
      message: 'Hello Vue with TypeScript!'
    }
  }
})
</script>`,
  },
  {
    label: "Angular",
    name: "angular",
    meta: "Angular",
    sandpackTemplate: "angular",
    sandpackTheme: "light",
    snippetFileName: "/src/app/app.component.ts",
    snippetLanguage: "typescript",
    initialSnippetContent: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div>
      <h1>{{ title }}</h1>
    </div>
  \`
})
export class AppComponent {
  title = 'Hello Angular!';
}`,
  },
  {
    label: "Svelte",
    name: "svelte",
    meta: "Svelte",
    sandpackTemplate: "svelte",
    sandpackTheme: "light",
    snippetFileName: "/src/App.svelte",
    snippetLanguage: "svelte",
    initialSnippetContent: `<script>
  let message = 'Hello Svelte!';
</script>

<main>
  <h1>{message}</h1>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
  }
</style>`,
  },
  {
    label: "Solid",
    name: "solid",
    meta: "SolidJS",
    sandpackTemplate: "solid",
    sandpackTheme: "light",
    snippetFileName: "/src/App.jsx",
    snippetLanguage: "jsx",
    initialSnippetContent: `import { createSignal } from 'solid-js';

function App() {
  const [message] = createSignal('Hello SolidJS!');

  return (
    <div>
      <h1>{message()}</h1>
    </div>
  );
}

export default App;`,
  },
  // Vanilla JavaScript/TypeScript
  {
    label: "Vanilla JavaScript",
    name: "vanilla",
    meta: "Plain JavaScript",
    sandpackTemplate: "vanilla",
    sandpackTheme: "light",
    snippetFileName: "/index.js",
    snippetLanguage: "javascript",
    initialSnippetContent: `console.log('Hello World!');

// Your JavaScript code here
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('Developer'));`,
  },
  {
    label: "Vanilla TypeScript",
    name: "vanilla-ts",
    meta: "Plain TypeScript",
    sandpackTemplate: "vanilla-ts",
    sandpackTheme: "light",
    snippetFileName: "/index.ts",
    snippetLanguage: "typescript",
    initialSnippetContent: `console.log('Hello World!');

// Your TypeScript code here
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('Developer'));`,
  },
  // Backend/Node.js
  {
    label: "Node.js",
    name: "node",
    meta: "Node.js Server",
    sandpackTemplate: "node",
    sandpackTheme: "light",
    snippetFileName: "/index.js",
    snippetLanguage: "javascript",
    initialSnippetContent: `const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});`,
  },
  // Static HTML/CSS
  {
    label: "Static HTML",
    name: "static",
    meta: "Static HTML",
    sandpackTemplate: "static",
    sandpackTheme: "light",
    snippetFileName: "/index.html",
    snippetLanguage: "html",
    initialSnippetContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
        }
    </style>
</head>
<body>
    <h1>Hello World!</h1>
    <p>Welcome to your HTML page.</p>
</body>
</html>`,
  },
  // Testing Frameworks
  {
    label: "Jest",
    name: "jest",
    meta: "Jest Testing",
    sandpackTemplate: "jest",
    sandpackTheme: "light",
    snippetFileName: "/src/App.test.js",
    snippetLanguage: "javascript",
    initialSnippetContent: `import { render, screen } from '@testing-library/react';
import App from './App';

test('renders hello world', () => {
  render(<App />);
  const element = screen.getByText(/hello world/i);
  expect(element).toBeInTheDocument();
});`,
  },
  // Build Tools
  {
    label: "Vite",
    name: "vite",
    meta: "Vite Build Tool",
    sandpackTemplate: "vite",
    sandpackTheme: "light",
    snippetFileName: "/src/main.js",
    snippetLanguage: "javascript",
    initialSnippetContent: `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`,
  },
  // Database/API
  {
    label: "GraphQL",
    name: "graphql",
    meta: "GraphQL API",
    sandpackTemplate: "graphql",
    sandpackTheme: "light",
    snippetFileName: "/schema.graphql",
    snippetLanguage: "graphql",
    initialSnippetContent: `type Query {
  hello: String
}

type Mutation {
  updateMessage(message: String!): String
}

schema {
  query: Query
  mutation: Mutation
}`,
  },
  // Mobile Development
  {
    label: "React Native",
    name: "react-native",
    meta: "React Native",
    sandpackTemplate: "react-native",
    sandpackTheme: "light",
    snippetFileName: "/App.js",
    snippetLanguage: "jsx",
    initialSnippetContent: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello React Native!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});`,
  },
  // Game Development
  {
    label: "Three.js",
    name: "threejs",
    meta: "Three.js 3D",
    sandpackTemplate: "threejs",
    sandpackTheme: "light",
    snippetFileName: "/src/App.js",
    snippetLanguage: "javascript",
    initialSnippetContent: `import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();`,
  },
  // Data Science
  {
    label: "Python",
    name: "python",
    meta: "Python Script",
    sandpackTemplate: "python",
    sandpackTheme: "light",
    snippetFileName: "/main.py",
    snippetLanguage: "python",
    initialSnippetContent: `print("Hello World!")

# Your Python code here
def greet(name):
    return f"Hello, {name}!"

print(greet("Developer"))`,
  },
  // Web Components
  {
    label: "Web Components",
    name: "web-components",
    meta: "Custom Elements",
    sandpackTemplate: "web-components",
    sandpackTheme: "light",
    snippetFileName: "/index.html",
    snippetLanguage: "html",
    initialSnippetContent: `<!DOCTYPE html>
<html>
<head>
    <title>Web Components Demo</title>
</head>
<body>
    <my-element></my-element>
    
    <script>
        class MyElement extends HTMLElement {
            constructor() {
                super();
                this.innerHTML = '<h1>Hello from Web Component!</h1>';
            }
        }
        customElements.define('my-element', MyElement);
    </script>
</body>
</html>`,
  },
  // CSS Frameworks
  {
    label: "Tailwind CSS",
    name: "tailwindcss",
    meta: "Tailwind CSS",
    sandpackTemplate: "tailwindcss",
    sandpackTheme: "light",
    snippetFileName: "/index.html",
    snippetLanguage: "html",
    initialSnippetContent: `<!DOCTYPE html>
<html>
<head>
    <title>Tailwind CSS Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold text-gray-800 mb-4">Hello Tailwind!</h1>
        <p class="text-gray-600">Welcome to your styled page.</p>
    </div>
</body>
</html>`,
  },
  // State Management
  {
    label: "Redux Toolkit",
    name: "redux",
    meta: "Redux Toolkit",
    sandpackTemplate: "redux",
    sandpackTheme: "light",
    snippetFileName: "/src/App.js",
    snippetLanguage: "javascript",
    initialSnippetContent: `import React from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => dispatch(counterSlice.actions.increment())}>
        Increment
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}`,
  },
];
