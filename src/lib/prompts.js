// Starter prompts. The texts match the agent test messages in agents/lyzr/test-messages/ and demo/.

const SENIOR_DE_JD = `We are looking for a Senior Data Engineer to build and maintain data pipelines for our healthcare analytics platform.

Required:
- 5+ years of professional software engineering experience
- Strong Python and SQL
- Hands-on experience with AWS
- Experience building ETL / data pipelines
- Healthcare or life-sciences domain knowledge

Preferred:
- Apache Spark
- Apache Airflow

Responsibilities:
- Design, build and maintain batch data pipelines
- Integrate data from multiple source systems`;

const LEAD_DE_JD = `Title: Lead Data Engineer - Healthcare Data Platform

We are looking for a Lead Data Engineer to build and run the data platform behind our healthcare analytics products. You will design batch and streaming pipelines, set data quality standards, and lead a small team of engineers working with clinical and claims data.

## Required
- 8+ years of professional data engineering experience
- Strong Python and SQL
- Hands-on experience with Apache Spark and Apache Airflow
- Experience with a cloud data warehouse such as Snowflake or Amazon Redshift
- Hands-on AWS experience, including infrastructure as code (Terraform)
- Healthcare or life-sciences domain experience, including handling of regulated patient data
- Experience leading or mentoring a team of engineers

## Preferred
- Streaming data pipelines with Apache Kafka
- dbt for data transformation and testing
- CI/CD for data pipelines
- Data quality frameworks and monitoring
- Experience presenting technical trade-offs to client stakeholders

## Responsibilities
- Lead the design and delivery of batch and streaming ingestion pipelines
- Model curated datasets in the warehouse for analytics teams
- Define and enforce data quality and code review standards
- Mentor engineers and review designs and pull requests
- Work with client stakeholders on priorities and delivery status`;

export const STARTERS = [
  {
    id: 'tailored',
    icon: 'document',
    title: 'Tailored resume',
    description: 'Ananya Krishnan for a Lead Data Engineer, Healthcare role',
    prompt: `Build a resume for Ananya Krishnan for this JD:\n\n${LEAD_DE_JD}`
  },
  {
    id: 'anonymize',
    icon: 'eyeOff',
    title: 'Hide client names',
    description: 'Same resume with clients replaced by neutral descriptions',
    prompt: `Build a resume for Rajkumar for this JD, and hide client names:\n\n${SENIOR_DE_JD}`
  },
  {
    id: 'ambiguous',
    icon: 'users',
    title: 'Ambiguous name',
    description: 'See how the agent asks which employee you mean',
    prompt: `Build a resume for Arun for this JD:\n\n${SENIOR_DE_JD}`
  },
  {
    id: 'weak',
    icon: 'scale',
    title: 'Weak fit check',
    description: 'See the agent flag a very low match before writing anything',
    prompt: 'Build a resume for Rajkumar for a Rust embedded firmware engineer role. Must have: Rust, RTOS, C/C++, bare-metal drivers, 5+ years in embedded systems.'
  }
];
