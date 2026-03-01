import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import LoadingScreen from "./components/LoadingScreen";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetMe } from "./hooks/useQueries";
import AdminPage from "./pages/AdminPage";
import BattleRoomPage from "./pages/BattleRoomPage";
import LobbyPage from "./pages/LobbyPage";
import RegisterPage from "./pages/RegisterPage";
import WalletPage from "./pages/WalletPage";

// Export navigate hook for use in other components
export { useNavigate, useParams };

function AuthGuard() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const { data: me, isLoading: meLoading } = useGetMe();

  const isLoading = isInitializing || actorFetching || meLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!identity) {
    return <RegisterPage authMode="login" />;
  }

  if (!me) {
    return <RegisterPage authMode="register" />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

// Routes
const rootRoute = createRootRoute({
  component: AuthGuard,
});

const lobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LobbyPage,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: WalletPage,
});

const battleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/battle/$battleId",
  component: BattleRoomPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  lobbyRoute,
  walletRoute,
  battleRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "bg-card border-border text-foreground font-body",
            success: "border-green-500/50",
            error: "border-red-500/50",
          },
        }}
      />
    </>
  );
}
