// src/pages/index.tsx
import Layout from "@/components/Layout";
import HomeUI from "@/components/HomeUI";

const Home = () => {
  return (
    <Layout>
      <div className="mb-16 md:mb-0">
        <HomeUI />
      </div>
    </Layout>
  );
};

export default Home;