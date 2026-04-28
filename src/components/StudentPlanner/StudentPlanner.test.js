import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import StudentPlanner from './index';
import * as db from '../../services/db';
import { supabase } from '../../services/supabaseClient';

// Mock the db services
jest.mock('../../services/db');

// Mock supabase client
jest.mock('../../services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

describe('StudentPlanner', () => {
  const mockMajorRequirements = {
    id: 'CSCI',
    name: 'Computer Science B.S.',
    requirements: {
      major_requirements: [
        { type: 'course', course_id: 'CS101', name: 'Intro to CS' }
      ],
      core_requirements: [
        { type: 'course', name: 'Math 101', description: 'Calculus I' }
      ]
    }
  };

  const mockMajorOptions = [
    { value: 'CSCI', label: 'Computer Science' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    db.getAllMajorsOptions.mockResolvedValue(mockMajorOptions);
    db.getMajorRequirements.mockResolvedValue(mockMajorRequirements);
    db.getUserProfile.mockResolvedValue({ id: 'user123', major: 'CSCI', full_name: 'Test Student', starting_term: 'Fall 2024' });
    db.getUserCourses.mockResolvedValue([]);
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user123' } } } });
  });

  it('renders the planner header with student name', async () => {
    render(<StudentPlanner />);
    
    await waitFor(() => {
      expect(screen.getByText(/Degree Roadmap for Test Student/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Computer Science • Class of 2028/i)).toBeInTheDocument();
  });

  it('allows searching for courses', async () => {
    db.searchCourses.mockResolvedValue([{ id: 'CS106B', name: 'Programming Abstractions' }]);
    
    render(<StudentPlanner />);
    
    const searchInput = screen.getByPlaceholderText(/Search by ID/i);
    fireEvent.change(searchInput, { target: { value: 'CS106' } });
    
    await waitFor(() => {
      expect(db.searchCourses).toHaveBeenCalledWith('CS106');
    });
    
    await waitFor(() => {
      expect(screen.getByText('CS106B')).toBeInTheDocument();
    });
  });

  it('allows selecting a course and adding it to a term', async () => {
    db.searchCourses.mockResolvedValue([{ id: 'CS106B', name: 'Programming Abstractions' }]);
    db.getCourseData.mockResolvedValue({ difficultyTotal: 10, difficultyCount: 5, workloadTotal: 50, workloadCount: 5 });
    db.saveUserCourse.mockResolvedValue([{ id: 1, course_id: 'CS106B', year: 1, term: 'Fall', status: 'planned', credits: 5 }]);

    render(<StudentPlanner />);
    
    fireEvent.change(screen.getByPlaceholderText(/Search by ID/i), { target: { value: 'CS106' } });
    
    await waitFor(() => {
      expect(screen.getByText('CS106B')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('CS106B'));
    
    await waitFor(() => {
      expect(db.getCourseData).toHaveBeenCalledWith('CS106B');
    });

    const addButtons = screen.getAllByText(/ADD CS106B/i);
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(db.saveUserCourse).toHaveBeenCalled();
      const courses = screen.getAllByText('CS106B');
      expect(courses.length).toBeGreaterThan(1); 
    });
  });

  it('allows removing a course', async () => {
    const mockCourse = { id: 123, course_id: 'CS101', year: 1, term: 'Fall', status: 'planned', credits: 5 };
    db.getUserCourses.mockResolvedValue([mockCourse]);
    db.deleteUserCourse.mockResolvedValue(true);

    render(<StudentPlanner />);
    
    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('delete'); // material-symbols-outlined
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(db.deleteUserCourse).toHaveBeenCalledWith(123);
      expect(screen.queryByText('CS101')).not.toBeInTheDocument();
    });
  });

  it('allows updating course status', async () => {
    const mockCourse = { id: 123, course_id: 'CS101', year: 1, term: 'Fall', status: 'planned', credits: 5 };
    const updatedCourse = { ...mockCourse, status: 'completed' };
    
    db.getUserCourses.mockResolvedValue([mockCourse]);
    db.updateUserCourse.mockResolvedValue([updatedCourse]);

    render(<StudentPlanner />);
    
    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    const completedButton = screen.getByText('Completed');
    fireEvent.click(completedButton);

    await waitFor(() => {
      expect(db.updateUserCourse).toHaveBeenCalledWith(123, { status: 'completed' });
    });
  });
});
