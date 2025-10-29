import PageNotFound from "../../../components/PageNotFound";

/**
 * 404 Page for Products Import Route
 * Shows a modern not found page when users try to access /app/products/import
 */
const ProductsImportNotFoundPage = () => {
  return (
    <PageNotFound
      title="Page Not Found"
      description="The product import feature is not available."
      details="This functionality has been disabled. If you need to import products, please contact your system administrator."
      icon="upload"
      showBackToProducts={true}
      showDashboard={true}
    />
  );
};

export default ProductsImportNotFoundPage;
