import ServerMenu from "@/components/server_layout";
import MainContentWrapper from "@/components/layout_wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServerMenu />
      <MainContentWrapper>
        {children}
      </MainContentWrapper>
    </>
  );
}
