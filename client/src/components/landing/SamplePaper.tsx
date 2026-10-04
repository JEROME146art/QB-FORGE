import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Clock, Users, BookOpen } from 'lucide-react';

export function SamplePaper() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Sample Exam Paper</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Preview the professional formatting and layout of your generated question papers.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto overflow-hidden">
          <CardContent className="p-8">
            {/* College Header */}
            <div className="text-center mb-8">
              <div className="h-16 w-16 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">QP</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">SRM University</h1>
              <h2 className="text-xl font-semibold mb-2">Department of Computer Science</h2>
              <p className="text-lg">Question Paper: CS201 - Data Structures</p>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">3 Hours</p>
              </div>
              <div className="text-center">
                <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">100 Marks</p>
              </div>
              <div className="text-center">
                <BookOpen className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">20 Questions</p>
              </div>
              <div className="text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">Set A</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm"><strong>Instructions:</strong> Answer all questions. Each question is worth the marks indicated. Use separate answer sheets for each part.</p>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Explain the difference between arrays and linked lists. Discuss their time complexity for various operations.</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">Medium</Badge>
                    <Badge variant="outline">Unit 1</Badge>
                    <Badge variant="outline">CO1</Badge>
                    <Badge variant="outline">8 marks</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Write a recursive function to reverse a linked list. Provide the time and space complexity analysis.</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">Hard</Badge>
                    <Badge variant="outline">Unit 2</Badge>
                    <Badge variant="outline">CO2</Badge>
                    <Badge variant="outline">12 marks</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">What is a binary search tree? Explain insertion and deletion operations with examples.</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">Easy</Badge>
                    <Badge variant="outline">Unit 3</Badge>
                    <Badge variant="outline">CO1</Badge>
                    <Badge variant="outline">5 marks</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <Badge variant="outline" className="mt-1">4</Badge>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Design an algorithm to find the shortest path between two vertices in a weighted graph. Analyze its complexity.</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">Hard</Badge>
                    <Badge variant="outline">Unit 4</Badge>
                    <Badge variant="outline">CO3</Badge>
                    <Badge variant="outline">15 marks</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Key Preview */}
            <div className="mt-8 p-6 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                Answer Key Preview
              </h3>
              <div className="space-y-3 text-sm">
                <div><strong>1.</strong> Arrays provide O(1) access time while linked lists provide O(n) access but O(1) insertion/deletion. Detailed answer expected...</div>
                <div><strong>2.</strong> Recursive reversal: Define base case when head is null. Recursive calls to reverse the rest...</div>
                <div><strong>3.</strong> BST is a binary tree where left child &lt; parent &lt; right child. Insertion: traverse to leaf...</div>
                <div><strong>4.</strong> Dijkstra's algorithm using priority queue. Time complexity: O((V+E)logV)...</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 justify-center">
              <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                <Download className="h-5 w-5" />
                Download Full Paper
              </button>
              <button className="flex items-center gap-2 px-6 py-3 border border-input rounded-lg font-medium hover:bg-accent transition-colors">
                <FileText className="h-5 w-5" />
                Download Answer Key
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}