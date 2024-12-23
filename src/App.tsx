import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';

import Home from '@/screens/home';

import '@/index.css';
import VirtualKeyboard from './components/VirtualKeyboard';

const paths = [
    {
        path: '/',
        element: (
          <Home/>
        ),
    },
    {
      path: '/virtualKeyboard',
      element: (
        <VirtualKeyboard />
      ),
  },
];

const BrowserRouter = createBrowserRouter(paths);

const App = () => {
    return (
    <MantineProvider>
      <RouterProvider router={BrowserRouter}/>
    </MantineProvider>
    )
};

export default App;