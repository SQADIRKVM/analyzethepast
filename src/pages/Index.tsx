
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export default function Index() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b py-4">
        <div className="container flex items-center justify-between">
          <h1 className="text-xl font-bold">Question Paper Analyzer</h1>
          <nav className="flex gap-4">
            <Link to="/analyzer">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="py-24 px-4 md:py-32">
          <div className="container mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                  Analyze Your Previous Year Question Papers
                </h1>
                <p className="text-lg text-muted-foreground">
                  Upload your scanned question papers and use AI to extract questions, 
                  find related educational videos, and more.
                </p>
                <div className="flex gap-4">
                  <Link to="/analyzer">
                    <Button size="lg" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-8 border border-border">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-1 rounded">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <p className="font-medium">Upload PDF</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload scanned question papers in PDF format.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-1 rounded">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <p className="font-medium">Extract & Process</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Our AI extracts and enhances the questions automatically.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-1 rounded">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <p className="font-medium">Find Related Videos</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get relevant educational videos for each question.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-6">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Question Paper Analyzer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
