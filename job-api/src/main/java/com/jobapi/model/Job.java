package com.jobapi.model;

import java.time.LocalDateTime;

public class Job {

    private String id;
    private String title;
    private String company;
    private String location;
    private String description;
    private String url;
    private String source;
    private String logoUrl;
    private String salary;
    private String type;
    private LocalDateTime postedDate;
    private String companyUrl;

    public Job() {}

    public Job(String id, String title, String company, String location, String description, String url, String source){
        this.id = id;
        this.title = title;
        this.company = company;
        this.location = location;
        this.description = description;
        this.url = url;
        this.source = source;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getPostedDate() { return postedDate; }
    public void setPostedDate(LocalDateTime postedDate) { this.postedDate = postedDate; }

    public String getCompanyUrl() { return companyUrl; }
    public void setCompanyUrl(String companyUrl) { this.companyUrl = companyUrl; }

    @Override
    public String toString() {
        return "Job{" +
                "title='" + title + '\'' +
                ", company='" + company + '\'' +
                ", location='" + location + '\'' +
                '}';
    }
}
