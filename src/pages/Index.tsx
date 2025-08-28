// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Logo in top left */}
      <div className="absolute top-8 left-8">
        <img 
          src="/lovable-uploads/c4d663bc-27ef-4ba5-9a5e-f8401832952e.png" 
          alt="Logo" 
          className="h-16 w-auto"
        />
      </div>
      
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Your Blank App</h1>
          <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
