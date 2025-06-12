package com.ehs.elearning.config;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.repository.CourseRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DatabaseInitializer {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @PostConstruct
    @Transactional
    public void initializeDatabase() {
        
        // Fix any courses with null hasBeenPublished
        List<Course> allCourses = courseRepository.findAll();
        for (Course course : allCourses) {
            if (course.getHasBeenPublished() == null) {
                course.setHasBeenPublished(false);
                // If course was published before, mark it as previously published
                if (course.getPublishedAt() != null || 
                    course.getStatus() == Course.CourseStatus.PUBLISHED) {
                    course.setHasBeenPublished(true);
                    if (course.getFirstPublishedAt() == null && course.getPublishedAt() != null) {
                        course.setFirstPublishedAt(course.getPublishedAt());
                    }
                }
                courseRepository.save(course);
            }
        }
        
    }
}