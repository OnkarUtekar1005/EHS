package com.ehs.elearning.repository;

import com.ehs.elearning.model.Certificate;
import com.ehs.elearning.model.CertificateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, UUID> {
    
    Optional<Certificate> findByCertificateNumber(String certificateNumber);
    
    Optional<Certificate> findByVerificationCode(String verificationCode);
    
    Optional<Certificate> findByUserIdAndCourseId(UUID userId, UUID courseId);
    
    List<Certificate> findByUserId(UUID userId);
    
    List<Certificate> findByUserIdAndStatus(UUID userId, CertificateStatus status);
    
    @Query("SELECT c FROM Certificate c " +
           "WHERE c.user.id = :userId " +
           "AND c.status = 'ACTIVE' " +
           "ORDER BY c.issuedDate DESC")
    List<Certificate> findActiveCertificatesByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT COUNT(c) FROM Certificate c " +
           "WHERE EXTRACT(YEAR FROM c.issuedDate) = :year")
    Long countByYear(@Param("year") int year);
    
    @Query("SELECT c FROM Certificate c " +
           "WHERE c.expiryDate IS NOT NULL " +
           "AND c.expiryDate < :currentDate " +
           "AND c.status = 'ACTIVE'")
    List<Certificate> findExpiredCertificates(@Param("currentDate") LocalDateTime currentDate);
    
    boolean existsByCertificateNumber(String certificateNumber);
    
    @Query("SELECT COUNT(c) FROM Certificate c")
    Long countAllCertificates();
    
    List<Certificate> findByCourseId(UUID courseId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Certificate c WHERE c.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") UUID courseId);
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM certificates WHERE user_id = :userId", nativeQuery = true)
    void deleteByUserId(@Param("userId") UUID userId);
}