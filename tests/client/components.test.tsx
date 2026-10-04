import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Button } from '../../client/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../client/src/components/ui/card';
import { Input } from '../../client/src/components/ui/input';
import { Badge } from '../../client/src/components/ui/badge';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('UI Components', () => {
  describe('Button', () => {
    it('should render with default variant', () => {
      render(<Button>Click Me</Button>);
      const button = screen.getByText('Click Me');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary');
    });

    it('should render with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByText('Outline');
      expect(button).toHaveClass('border');
    });

    it('should trigger onClick handler', () => {
      const mockFn = jest.fn();
      render(<Button onClick={mockFn}>Click</Button>);
      fireEvent.click(screen.getByText('Click'));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should not trigger when disabled', () => {
      const mockFn = jest.fn();
      render(<Button disabled onClick={mockFn}>Disabled</Button>);
      fireEvent.click(screen.getByText('Disabled'));
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('Card', () => {
    it('should render all card parts', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Content</CardContent>
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Card className="bg-red-500">Red Card</Card>);
      const card = screen.getByText('Red Card').closest('.bg-red-500');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Input', () => {
    it('should render with placeholder', () => {
      render(<Input placeholder="Enter email" />);
      const input = screen.getByPlaceholderText('Enter email');
      expect(input).toBeInTheDocument();
    });

    it('should handle input value changes', () => {
      const mockFn = jest.fn();
      render(<Input onChange={mockFn} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      expect(mockFn).toHaveBeenCalled();
    });

    it('should apply correct ARIA role', () => {
      render(<Input aria-label="Search input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Search input');
    });
  });

  describe('Badge', () => {
    it('should render with default variant', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render with secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Badge className="text-2xl">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge).toHaveClass('text-2xl');
    });
  });
});