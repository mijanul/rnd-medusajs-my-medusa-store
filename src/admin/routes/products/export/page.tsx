import PageNotFound from "../../../components/PageNotFound";

/**
 * 404 Page for Products Export Route
 * Shows a modern not found page when users try to access /app/products/export
 */
const ProductsExportNotFoundPage = () => {
  return (
    <PageNotFound
      title="Page Not Found"
      description="The product export feature is not available."
      details="This functionality has been disabled. If you need to export products, please contact your system administrator."
      icon="download"
      showBackToProducts={true}
      showDashboard={true}
    />
  );
};

export default ProductsExportNotFoundPage;
