import "./global.css";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { store, useAppDispatch } from "./store";
import { hydrateAuthThunk } from "./store/slices/authSlice";
import { AppNavigator } from "./Navigation";

function Main() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(hydrateAuthThunk());
  }, [dispatch]);

  return <AppNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <Main />
      </SafeAreaProvider>
    </Provider>
  );
}
