package com.ehs.elearning;

import com.ehs.elearning.model.Course;
import com.ehs.elearning.repository.CourseRepository;
import com.ehs.elearning.service.CourseService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@SpringBootTest
public class CoursePublishTest {
    
    @Autowired
    private CourseService courseService;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Test
    @Transactional
    public void testPublishCourse() {
        // Try to find a course and test publishing
        Course firstCourse = courseService.getFirstCourse();
        if (firstCourse != null) {
            System.out.println("Testing course: " + firstCourse.getTitle());
            System.out.println("Status: " + firstCourse.getStatus());
            System.out.println("HasBeenPublished: " + firstCourse.getHasBeenPublished());
            
            if (firstCourse.getStatus() != Course.CourseStatus.PUBLISHED) {
                try {
                    Course published = courseService.publishCourse(firstCourse.getId());
                    System.out.println("Published successfully!");
                    System.out.println("New status: " + published.getStatus());
                    System.out.println("HasBeenPublished: " + published.getHasBeenPublished());
                } catch (Exception e) {
                    System.err.println("Error publishing: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        } else {
            System.out.println("No courses found in database");
        }
    }
}