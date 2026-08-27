import { redirect } from "next/navigation";

export default function Home() {
  // Directly redirect to login, middleware will handle session redirects
  redirect("/login");
}
